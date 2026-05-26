export const dynamic = "force-dynamic";

import Link from "next/link";
import MetricCard from "../../../components/dashboard/metric-card";
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
        sessionLifecycle: sessionContext.auth.sessionId ? "persisted" : "missing",
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
        sessionLifecycle: sessionContext.auth.sessionId ? "persisted" : "missing",
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

  const purchasedMiles = purchases.reduce(
    (sum, purchase) => sum + (purchase.points || 0),
    0,
  );
  const soldMiles = sales.reduce((sum, sale) => sum + (sale.points || 0), 0);
  const transferredMiles = transfers.reduce(
    (sum, transfer) => sum + (transfer.pointsSent || 0),
    0,
  );
  const revenueCents = sales.reduce(
    (sum, sale) => sum + (sale.revenueCents || 0),
    0,
  );
  const profitCents = sales.reduce(
    (sum, sale) => sum + (sale.profitCents || 0),
    0,
  );
  const marginPercent = revenueCents > 0 ? (profitCents / revenueCents) * 100 : 0;
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

  const quickActions = [
    { href: "/app/purchases", label: "Nova compra", description: "Registrar uma nova aquisição de milhas." },
    { href: "/app/sales", label: "Nova venda", description: "Abrir a tela de venda operacional." },
    { href: "/app/transfers", label: "Nova transferência", description: "Mover saldo entre programas." },
    { href: "/app/inspection", label: "Inspeção", description: "Abrir replay, FIFO e recovery guiado." },
    { href: "/app/inspection", label: "Reconcile", description: "Validar e corrigir inconsistências." },
  ];

  return (
    <div className="space-y-6">
      {accessContext.accessState === "TRIAL" ? (
        <TrialBanner
          tone="warning"
          title="Seu trial SaaS está ativo"
          description="O dashboard continua operacional enquanto o período de avaliação estiver válido."
        />
      ) : null}
      <PageHeader
        eyebrow="MVP operacional"
        title="Dashboard operacional"
        subtitle="Resumo do SaaS com leitura humana: saldo, margem, integridade, warnings e ações rápidas para operar sem perder o contexto."
        actions={
          <>
            <Link
              href="/app/purchases"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Nova compra
            </Link>
            <Link
              href="/app/inspection"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Inspeção
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo total"
          value={formatPoints(metrics.totalBalance)}
          caption="Saldo operacional em todas as contas"
          tone="success"
        />
        <MetricCard
          title="Milhas totais"
          value={formatPoints(purchasedMiles)}
          caption="Volume comprado no período recente"
          tone="neutral"
        />
        <MetricCard
          title="Custo médio"
          value={formatMoneyCents(metrics.avgCpmCents)}
          caption="CPM médio consolidado"
          tone="neutral"
        />
        <MetricCard
          title="Margem atual"
          value={`${marginPercent.toFixed(1)}%`}
          caption={
            revenueCents > 0
              ? `Receita ${formatMoneyCents(revenueCents)} · Lucro ${formatMoneyCents(profitCents)}`
              : "Ainda sem vendas suficientes para calcular margem"
          }
          tone={marginPercent >= 0 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Estado operacional
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Confiança operacional do runtime
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {validationLabel} validado agora para a organização atual.
              </p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusMeta.tone === "ok" ? "bg-emerald-100 text-emerald-800" : statusMeta.tone === "attention" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
              {statusMeta.label}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatusFact label="Última validação" value={validatedAt} />
            <StatusFact label="Warnings ativos" value={String(warnings.length)} />
            <StatusFact label="Reconcile pendentes" value={String(reconcilePending)} />
            <StatusFact label="Integridade" value={integrity.isConsistent ? "consistente" : "requer atenção"} />
            <StatusFact
              label="Pontos a receber"
              value={formatPoints(metrics.pointsToReceive)}
            />
            <StatusFact label="Milhas vendidas" value={formatPoints(soldMiles)} />
            <StatusFact
              label="Milhas transferidas"
              value={formatPoints(transferredMiles)}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Operar agora
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="text-sm font-semibold text-slate-950">
                    {action.label}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">
                    {action.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Alertas operacionais
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Warnings ativos e próximos passos
          </h2>
          <div className="mt-4 space-y-3">
            {warnings.length === 0 ? (
              <EmptyState
                title="Nenhum warning ativo"
                description="O runtime está coerente neste momento. Continue operando com inspeção periódica para manter a estabilidade."
                actionLabel="Abrir inspeção"
                actionHref="/app/inspection"
                supportingText="fluxo saudável"
              />
            ) : (
              warnings.slice(0, 4).map((warning) => (
                <div
                  key={`${warning.problem}-${warning.impactArea}`}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {warning.priority}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-950">
                    {warning.problem}
                  </div>
                  <div className="mt-2 text-sm text-amber-900">
                    {warning.action}
                  </div>
                  <div className="mt-2 text-xs text-amber-800">
                    Recovery: {warning.recoveryAction}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Contas principais
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Base operacional da organização
          </h2>
          <div className="mt-4 space-y-3">
            {accounts.length === 0 ? (
              <EmptyState
                title="Sem contas ainda"
                description="Crie a primeira conta para começar a registrar compras, vendas e transferências com contexto operacional completo."
                actionLabel="Ir para onboarding"
                actionHref="/app/onboarding"
                supportingText="primeiro passo"
              />
            ) : (
              accounts.slice(0, 4).map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {account.nickname}
                      </div>
                      <div className="text-xs text-slate-500">
                        {account.program ?? "Programa não identificado"}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      Conta ativa
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo</div>
                      <div className="font-semibold text-slate-950">{formatPoints(account.balance)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">CPM</div>
                      <div className="font-semibold text-slate-950">
                        {formatMoneyCents(account.cpmCents)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <ActivityPanel
          title="Compras recentes"
          emptyTitle="Sem compras registradas"
          emptyDescription="Registre sua primeira compra para alimentar o saldo operacional e o custo médio."
          emptyHref="/app/purchases"
          items={purchases.map((purchase) => ({
            title: purchase.program ?? purchase.account ?? `Compra #${purchase.id}`,
            lines: [
              `${purchase.points.toLocaleString()} pts`,
              formatMoneyCents(purchase.valueCents),
              purchase.status,
            ],
          }))}
        />
        <ActivityPanel
          title="Vendas recentes"
          emptyTitle="Sem vendas registradas"
          emptyDescription="Abra a tela de vendas quando quiser realizar a primeira liquidação operacional."
          emptyHref="/app/sales"
          items={sales.map((sale) => ({
            title: sale.program ?? sale.account ?? `Venda #${sale.id}`,
            lines: [
              `${sale.points.toLocaleString()} pts`,
              formatMoneyCents(sale.revenueCents),
              sale.status,
            ],
          }))}
        />
        <ActivityPanel
          title="Transferências recentes"
          emptyTitle="Sem transferências registradas"
          emptyDescription="Movimente pontos entre programas quando precisar ajustar a estratégia operacional."
          emptyHref="/app/transfers"
          items={transfers.map((transfer) => ({
            title: transfer.fromProgram ?? transfer.fromAccount ?? `Transferência #${transfer.id}`,
            lines: [
              `${transfer.pointsSent.toLocaleString()} -> ${transfer.pointsReceived.toLocaleString()} pts`,
              `${transfer.bonusPercent}% bônus`,
              transfer.status,
            ],
          }))}
        />
      </section>
    </div>
  );
}

function StatusFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-950">{value}</div>
    </div>
  );
}

function ActivityPanel({
  title,
  emptyTitle,
  emptyDescription,
  emptyHref,
  items,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyHref: string;
  items: Array<{ title: string; lines: string[] }>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel="Abrir tela"
            actionHref={emptyHref}
            supportingText="fluxo guiado"
          />
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={`${item.title}-${item.lines[0]}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">{item.title}</div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {item.lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
