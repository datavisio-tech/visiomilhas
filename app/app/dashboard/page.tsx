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
// getAccountsOverview intentionally not used on dashboard summary
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

  const [metrics, purchases, sales, transfers, integrity] = await Promise.all([
    getMetrics(effectiveSessionContext),
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
  const grossMargin =
    revenueCents > 0
      ? `${((profitCents / revenueCents) * 100).toFixed(1)}%`
      : "—";
  const latestUpdate = "4 minutos atrás";
  const warnings = prioritizeWarnings(
    integrity.issues.map((issue) => mapIssueToWarning(issue)),
  );
  const integrityStatus = resolveIntegrityStatus(integrity.issues);
  const validatedAt = new Date().toLocaleString("pt-BR");
  const reconcilePending = integrity.issues.length;
  const showOperationalDiagnostics = false;
  const statusMeta = humanizeOperationalStatus(integrityStatus);
  const validationLabel = buildNarrativeStatus(
    integrityStatus,
    warnings.length,
  );

  const topKpis = [
    {
      title: "Saldo consolidado",
      value: formatPoints(metrics.totalBalance),
      caption: "Visão global do patrimônio",
      tone: "success" as const,
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
      title: "CPM médio",
      value: formatMoneyCents(metrics.avgCpmCents),
      caption: "Custo por mil milha",
      tone: "neutral" as const,
    },
    {
      title: "Margem média",
      value: grossMargin,
      caption: "Comparação simples entre receita e lucro",
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
          variant="trial"
          tone="info"
          title="Sua operação premium está liberada."
          description="Acompanhe saldo, margem e movimentações sem limitações."
          trialEndsAt={accessContext.trialEndsAt?.toISOString() ?? null}
        />
      ) : null}

      <PageHeader
        title="Central operacional"
        eyebrow=""
        subtitle="Acompanhe saldo, custo, lucro e movimentações."
        actions={
          <>
            <PrimaryButton ariaLabel="Nova compra" href="/app/purchases">
              + Nova compra
            </PrimaryButton>
            <SecondaryButton href="/app/accounts">Contas</SecondaryButton>
          </>
        }
      />

      {/* Resumo de contas e movimentos descontinuado neste dashboard */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {topKpis.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            caption={metric.caption}
            tone={metric.tone}
            compact
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-label-xs font-semibold text-slate-500">
                Resumo gráfico
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                Receita e lucro
              </div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-label-sm font-semibold text-slate-700">
              Atualizado há {latestUpdate}
            </div>
          </div>
          <DashboardChart />
        </section>

        <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-label-xs font-semibold text-slate-500">
                Resumo simples
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                Operação organizada
              </div>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-label-sm font-semibold text-emerald-700 flex-shrink-0">
              {formatPoints(metrics.pointsToReceive)} a receber
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Sua base operacional está pronta para uso e continua crescendo com
            clareza.
          </p>

          {showOperationalDiagnostics ? (
            <div className="mt-6 grid gap-3">
              <StatusFact label="Status interno" value={statusMeta.label} />
              <StatusFact label="Resumo técnico" value={validationLabel} />
              <StatusFact label="Última verificação" value={validatedAt} />
              <StatusFact
                label="Pontos a receber"
                value={formatPoints(metrics.pointsToReceive)}
              />
              <StatusFact
                label="Avisos ativos"
                value={String(warnings.length)}
              />
              <StatusFact
                label="Reconciliações"
                value={String(reconcilePending)}
              />
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-label-xs font-semibold text-slate-500">
              Movimentações
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Movimentações recentes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Compras, vendas e transferências com valores destacados.
            </p>
          </div>
          <Link
            href="/app/accounts"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 hover:shadow-card flex-shrink-0"
          >
            Ver contas
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
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-card hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-950">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.detail}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="text-lg font-semibold text-slate-950">
                      {item.amount}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.tone === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.tone === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.tone === "success"
                          ? "Recebido"
                          : item.tone === "warning"
                            ? "Revisar"
                            : "Em processo"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.date}
                      </span>
                    </div>
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
