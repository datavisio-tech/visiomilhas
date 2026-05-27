export const dynamic = "force-dynamic";

import Link from "next/link";
import PrimaryButton, { SecondaryButton } from "../../../components/ui/button";
import MetricCard from "../../../components/dashboard/metric-card";
import DashboardChart from "../../../components/dashboard/dashboard-chart";
import EmptyState from "../../../components/ui/empty-state";
import PageHeader from "../../../components/ui/page-header";
import TrialBanner from "../../../components/layout/trial-banner";
import { getMetrics } from "../../../lib/server/dashboard";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../lib/server/subscription-access";
import {
  evaluateRolloutSanity,
  resolveRolloutAccess,
} from "../../../lib/server/rollout-control";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  formatMoneyCents,
  formatPoints,
  humanizeOperationalStatus,
  prioritizeWarnings,
  buildNarrativeStatus,
} from "../../../components/financial/operational-guidance";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "../../../lib/server/auth-observability";
import {
  buildOwnershipContext,
  buildSessionContext,
} from "../../../lib/server/auth-context";
import { getAccountsOverview } from "../../../lib/data/accounts";
import { getPurchasesOverview } from "../../../lib/data/purchases";
import { getSalesOverview } from "../../../lib/data/sales";
import { getTransfersOverview } from "../../../lib/data/transfers";
import { appPool } from "../../../db/app/client";
import {
  validateFinancialIntegrity,
  type FinancialIntegrityIssue,
} from "../../../lib/server/financial-integrity";

const criticalIntegrityCodes = new Set<FinancialIntegrityIssue["code"]>([
  "NEGATIVE_BALANCE_DETECTED",
  "ORPHAN_LOT_DETECTED",
  "ACCOUNT_ORPHAN_DETECTED",
  "OWNERSHIP_INCONSISTENT_DETECTED",
]);

function mapIssueToWarning(issue: FinancialIntegrityIssue): string {
  switch (issue.code) {
    case "NEGATIVE_BALANCE_DETECTED":
      return "saldo negativo detectado";
    case "ORPHAN_LOT_DETECTED":
      return "lote órfão detectado";
    case "FIFO_DIVERGENCE_DETECTED":
      return "divergência de saldo entre lote e conta";
    case "INVALID_CONSUMPTION_DETECTED":
      return "consumo inválido na sequência FIFO";
    case "DELTA_INCONSISTENT_DETECTED":
      return "replay divergente com delta inconsistente";
    case "BALANCE_ABOVE_ALLOWED_DETECTED":
      return "saldo impossível acima do permitido";
    case "ACCOUNT_ORPHAN_DETECTED":
      return "account orfã sem vínculo operacional";
    case "OWNERSHIP_INCONSISTENT_DETECTED":
      return "ownership inconsistente na conta";
    default:
      return "aviso operacional detectado";
  }
}

function resolveIntegrityStatus(issues: FinancialIntegrityIssue[]) {
  if (issues.length === 0) return "consistent" as const;
  if (issues.some((issue) => criticalIntegrityCodes.has(issue.code))) {
    return "broken" as const;
  }
  return "warning" as const;
}

type TimelineItem = {
  id: string;
  title: string;
  amount: string;
  detail: string;
  date: string;
  status: string;
  tone: "success" | "neutral" | "warning";
};

export default async function DashboardPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "dashboard.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/dashboard");
  }

  const rolloutAccess = await resolveRolloutAccess(sessionContext, {
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  if (!rolloutAccess.allowed) {
    redirect("/subscribe");
  }

  const accessContext = await resolveSubscriptionAccessContext(sessionContext, {
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  if (!accessContext) {
    redirect("/subscribe");
  }

  if (accessContext.shouldRedirectToSubscribe) {
    redirect("/subscribe");
  }

  await evaluateRolloutSanity({
    sessionContext,
    accessContext,
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  const effectiveSessionContext =
    sessionContext.ownership.organizationId === accessContext.organizationId
      ? sessionContext
      : buildSessionContext(
          sessionContext.auth,
          buildOwnershipContext({
            userId: sessionContext.auth.userId,
            accountId: sessionContext.ownership.accountId ?? null,
            organizationId: accessContext.organizationId,
            ownsAccount: sessionContext.ownership.ownsAccount,
            ownsOrganizationScope: true,
          }),
        );

  if (!effectiveSessionContext.ownership.organizationId) {
    const requestHeaders = await headers();
    const browserContext = resolveBrowserContextTag(
      requestHeaders.get("user-agent"),
    );

    reportAuthEvent({
      level: "warn",
      code: "ONBOARDING_CONTEXT_MISSING",
      message: "Dashboard requires onboarding before rendering data",
      details: {
        source: "dashboard.page",
        onboardingStage: "required",
        recoveryStage: "direct",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: sessionContext.auth.sessionId
          ? "persisted"
          : "missing",
      },
    });

    reportAuthEvent({
      level: "info",
      code: "ONBOARDING_REQUIRED_REDIRECT",
      message: "Redirecting dashboard to onboarding",
      details: {
        source: "dashboard.page",
        onboardingStage: "redirect",
        recoveryStage: "direct",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: sessionContext.auth.sessionId
          ? "persisted"
          : "missing",
        redirectPath: "/app/onboarding",
      },
    });

    redirect("/app/onboarding");
  }

  const organizationId = effectiveSessionContext.ownership.organizationId;
  const pool = appPool();

  const [metrics, accounts, purchases, sales, transfers, integrity] =
    await Promise.all([
      getMetrics(effectiveSessionContext),
      getAccountsOverview(effectiveSessionContext),
      getPurchasesOverview(effectiveSessionContext, 5),
      getSalesOverview(effectiveSessionContext, 5),
      getTransfersOverview(effectiveSessionContext, 5),
      validateFinancialIntegrity(pool, {
        organizationId,
        source: "dashboard.page",
        emitEvents: false,
      }),
    ]);

  const revenueCents = sales.reduce(
    (sum, sale) => sum + (sale.revenueCents || 0),
    0,
  );
  const profitCents = sales.reduce(
    (sum, sale) => sum + (sale.profitCents || 0),
    0,
  );
  const warnings = prioritizeWarnings(
    integrity.issues.map((issue) => mapIssueToWarning(issue)),
  );
  const integrityStatus = resolveIntegrityStatus(integrity.issues);
  const statusMeta = humanizeOperationalStatus(integrityStatus);
  const validationLabel = buildNarrativeStatus(
    integrityStatus,
    warnings.length,
  );
  const validatedAt = new Date().toLocaleString("pt-BR");
  const reconcilePending = integrity.issues.length;

  const topKpis = [
    {
      title: "Saldo total",
      value: formatPoints(metrics.totalBalance),
      caption: "Saldo operacional consolidado",
      tone: "success" as const,
    },
    {
      title: "CPM médio",
      value: formatMoneyCents(metrics.avgCpmCents),
      caption: "Custo por mil milha",
      tone: "neutral" as const,
    },
    {
      title: "Resultado operacional",
      value:
        revenueCents > 0
          ? formatMoneyCents(profitCents)
          : "Sem receita registrada",
      caption:
        revenueCents > 0
          ? `Receita ${formatMoneyCents(revenueCents)}`
          : "Acompanhe a primeira venda",
      tone: profitCents >= 0 ? ("success" as const) : ("warning" as const),
    },
    {
      title: "Contas conectadas",
      value: accounts.length,
      caption: "Programas e contas ativas",
      tone: "neutral" as const,
    },
  ];

  const timelineItems: TimelineItem[] = [
    ...purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      title: purchase.program ?? purchase.account ?? `Compra #${purchase.id}`,
      amount: `${formatPoints(purchase.points)} pts`,
      detail: `${formatMoneyCents(purchase.valueCents)} • ${purchase.description ?? purchase.status}`,
      date: new Date(purchase.date).toLocaleDateString("pt-BR"),
      status: purchase.status,
      tone: "success" as const,
    })),
    ...sales.map((sale) => ({
      id: `sale-${sale.id}`,
      title: sale.program ?? sale.account ?? `Venda #${sale.id}`,
      amount: `${formatPoints(sale.points)} pts`,
      detail: `${formatMoneyCents(sale.revenueCents)} • ${sale.description ?? sale.status}`,
      date: new Date(sale.date).toLocaleDateString("pt-BR"),
      status: sale.status,
      tone:
        sale.profitCents != null && sale.profitCents >= 0
          ? ("success" as const)
          : ("warning" as const),
    })),
    ...transfers.map((transfer) => ({
      id: `transfer-${transfer.id}`,
      title:
        transfer.fromProgram ??
        transfer.fromAccount ??
        `Transferência #${transfer.id}`,
      amount: `${formatPoints(transfer.pointsSent)} → ${formatPoints(
        transfer.pointsReceived,
      )} pts`,
      detail: `${transfer.bonusPercent}% bônus • ${transfer.description ?? transfer.status}`,
      date: new Date(transfer.date).toLocaleDateString("pt-BR"),
      status: transfer.status,
      tone: "neutral" as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {accessContext.accessState === "TRIAL" ? (
        <TrialBanner
          tone="warning"
          title="Período de avaliação ativo"
          description="Explore todos os recursos enquanto seu trial estiver válido."
        />
      ) : null}

      <PageHeader
        eyebrow="Dashboard"
        title="Sua operação em um só lugar"
        subtitle="Acompanhe saldo, custo e lucro com clareza."
        actions={
          <>
            <PrimaryButton ariaLabel="Nova compra" href="/app/purchases">
              + Nova compra
            </PrimaryButton>
            <SecondaryButton href="/app/inspection">Inspeção</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {topKpis.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            caption={metric.caption}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-label-xs font-semibold text-slate-500">
                Operação
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                Receita e lucro
              </div>
            </div>
          </div>
          <DashboardChart />
        </section>

        <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-label-xs font-semibold text-slate-500">
                Integridade
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                Saúde financeira
              </div>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 text-label-sm font-semibold flex-shrink-0 ${
                statusMeta.tone === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : statusMeta.tone === "attention"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {statusMeta.label}
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            {validationLabel}
          </p>

          <div className="mt-6 grid gap-3">
            <StatusFact label="Última verificação" value={validatedAt} />
            <StatusFact
              label="Pontos a receber"
              value={formatPoints(metrics.pointsToReceive)}
            />
            <StatusFact label="Avisos ativos" value={String(warnings.length)} />
            <StatusFact
              label="Reconciliações"
              value={String(reconcilePending)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-label-xs font-semibold text-slate-500">
              Movimentações
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Atividade recente
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Compras, vendas e transferências dos últimos dias
            </p>
          </div>
          <Link
            href="/app/inspection"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 hover:shadow-card flex-shrink-0"
          >
            Ver tudo
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {timelineItems.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação"
              description="Suas transações aparecerão aqui quando começarem a ser registradas."
              actionLabel="Registrar operação"
              actionHref="/app/purchases"
              supportingText="Acompanhe movimentações à medida que ocorrem"
            />
          ) : (
            timelineItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-card hover:border-slate-300"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-950">
                      {item.title}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-600">
                        {item.amount}
                      </span>
                      <span className="text-sm text-slate-500">
                        {item.detail}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.tone === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.tone === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.tone === "success"
                        ? "✓ Concluído"
                        : item.tone === "warning"
                          ? "⚠ Atenção"
                          : "○ Pendente"}
                    </span>
                    <span className="text-xs text-slate-500">{item.date}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatusFact({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        dark
          ? "border-white/10 bg-slate-900/80"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div
        className={`text-label-xs font-semibold ${
          dark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-sm font-semibold tracking-[-0.01em] ${dark ? "text-white" : "text-slate-950"}`}
      >
        {value}
      </div>
    </div>
  );
}
