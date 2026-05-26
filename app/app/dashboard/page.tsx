export const dynamic = "force-dynamic";

import Link from "next/link";
import PageHeader from "../../../components/ui/page-header";
import TrialBanner from "../../../components/layout/trial-banner";
import MetricCard from "../../../components/dashboard/metric-card";
import DashboardChart from "../../../components/dashboard/dashboard-chart";
import EmptyState from "../../../components/ui/empty-state";
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
} from "../../../components/financial/operational-guidance";
import { getAccountsOverview } from "../../../lib/data/accounts";
import { getPurchasesOverview } from "../../../lib/data/purchases";
import { getSalesOverview } from "../../../lib/data/sales";
import { getTransfersOverview } from "../../../lib/data/transfers";

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

  if (!accessContext || accessContext.shouldRedirectToSubscribe) {
    redirect("/subscribe");
  }

  await evaluateRolloutSanity({
    sessionContext,
    accessContext,
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  const [metrics, accounts, purchases, sales, transfers] = await Promise.all([
    getMetrics(sessionContext),
    getAccountsOverview(sessionContext),
    getPurchasesOverview(sessionContext, 5),
    getSalesOverview(sessionContext, 5),
    getTransfersOverview(sessionContext, 5),
  ]);

  const totalRevenueCents = sales.reduce(
    (sum, sale) => sum + (sale.revenueCents || 0),
    0,
  );
  const totalProfitCents = sales.reduce(
    (sum, sale) => sum + (sale.profitCents || 0),
    0,
  );
  const marginPercent =
    totalRevenueCents > 0 ? (totalProfitCents / totalRevenueCents) * 100 : 0;
  const uniquePrograms = Array.from(
    new Set(accounts.map((account) => account.program).filter(Boolean)),
  ).slice(0, 3) as string[];

  const recentMovements = [
    ...purchases.map((purchase) => ({
      kind: "Compra",
      title: purchase.program ?? purchase.account ?? `Compra #${purchase.id}`,
      detail: `${purchase.points.toLocaleString()} pts · ${formatMoneyCents(purchase.valueCents)}`,
      tone: "emerald" as const,
    })),
    ...sales.map((sale) => ({
      kind: "Venda",
      title: sale.program ?? sale.account ?? `Venda #${sale.id}`,
      detail: `${sale.points.toLocaleString()} pts · ${formatMoneyCents(sale.revenueCents)}`,
      tone: "blue" as const,
    })),
    ...transfers.map((transfer) => ({
      kind: "Transferência",
      title:
        transfer.fromProgram ??
        transfer.fromAccount ??
        `Transferência #${transfer.id}`,
      detail: `${transfer.pointsSent.toLocaleString()} → ${transfer.pointsReceived.toLocaleString()} pts`,
      tone: "violet" as const,
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      {accessContext.accessState === "TRIAL" ? (
        <TrialBanner
          tone="warning"
          title="Seu trial SaaS está ativo"
          description="Você pode continuar operando o painel enquanto o período de avaliação estiver válido."
        />
      ) : null}

      <PageHeader
        eyebrow="Painel"
        title="Painel"
        subtitle="Visão simples do saldo, lucro e movimentações da sua operação."
        actions={
          <>
            <Link
              href="/app/purchases"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Nova compra
            </Link>
            <Link
              href="/app/sales"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Nova venda
            </Link>
            <Link
              href="/app/transfers"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Transferência
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo total"
          value={formatPoints(metrics.totalBalance)}
          caption="Saldo consolidado das contas"
          tone="success"
        />
        <MetricCard
          title="Custo médio"
          value={formatMoneyCents(metrics.avgCpmCents)}
          caption="Custo do milheiro consolidado"
        />
        <MetricCard
          title="Lucro total"
          value={formatMoneyCents(totalProfitCents)}
          caption={`Margem de ${marginPercent.toFixed(1)}% nas vendas recentes`}
          tone={marginPercent >= 0 ? "success" : "warning"}
        />
        <MetricCard
          title="Valor em reais"
          value={formatMoneyCents(totalRevenueCents)}
          caption={`${sales.length} venda(s) recentes`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Evolução do saldo
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Visão simples da operação
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Resumo visual da rotina do produto com leitura rápida para o dia
                a dia.
              </p>
            </div>
            <Link
              href="/app/inspection"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              Diagnóstico avançado
            </Link>
          </div>

          <div className="mt-5">
            <DashboardChart />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Contas principais
          </div>
          <div className="mt-3 space-y-3">
            {accounts.length === 0 ? (
              <EmptyState
                title="Nenhuma conta ainda"
                description="Crie a primeira conta para começar a operar compras, vendas e transferências."
                actionLabel="Abrir onboarding"
                actionHref="/app/onboarding"
                supportingText="primeiro passo"
              />
            ) : (
              accounts.slice(0, 4).map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-slate-950">
                    {account.nickname}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {account.program ?? "Programa não identificado"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Saldo
                      </div>
                      <div className="mt-1 font-semibold text-slate-950">
                        {formatPoints(account.balance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        CPM
                      </div>
                      <div className="mt-1 font-semibold text-slate-950">
                        {formatMoneyCents(account.cpmCents)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {uniquePrograms.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Programas ativos
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {uniquePrograms.map((program) => (
                  <span
                    key={program}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {program}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Movimentações recentes
          </div>
          <div className="mt-4 space-y-3">
            {recentMovements.length === 0 ? (
              <EmptyState
                title="Sem movimentações recentes"
                description="As primeiras compras, vendas e transferências aparecerão aqui para mostrar a atividade da conta."
                actionLabel="Ir para compras"
                actionHref="/app/purchases"
                supportingText="atividade inicial"
              />
            ) : (
              recentMovements.map((movement, index) => (
                <div
                  key={`${movement.kind}-${movement.title}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {movement.kind}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {movement.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {movement.detail}
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      movement.tone === "emerald"
                        ? "bg-emerald-100 text-emerald-700"
                        : movement.tone === "blue"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    Recentemente
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Compras e vendas
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CompactList
              title="Compras recentes"
              emptyTitle="Nenhuma compra registrada"
              emptyDescription="Registre sua primeira compra para alimentar o saldo e o custo médio."
              emptyHref="/app/purchases"
              items={purchases.map((purchase) => ({
                label:
                  purchase.program ??
                  purchase.account ??
                  `Compra #${purchase.id}`,
                detail: `${purchase.points.toLocaleString()} pts · ${formatMoneyCents(purchase.valueCents)}`,
              }))}
            />
            <CompactList
              title="Vendas recentes"
              emptyTitle="Nenhuma venda registrada"
              emptyDescription="A primeira venda vai mostrar receita, lucro e movimentação no painel."
              emptyHref="/app/sales"
              items={sales.map((sale) => ({
                label: sale.program ?? sale.account ?? `Venda #${sale.id}`,
                detail: `${sale.points.toLocaleString()} pts · ${formatMoneyCents(sale.revenueCents)}`,
              }))}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Transferências recentes
            </div>
            <div className="mt-3 space-y-2">
              {transfers.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Nenhuma transferência registrada ainda.
                </div>
              ) : (
                transfers.slice(0, 3).map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="font-medium text-slate-950">
                      {transfer.fromProgram ?? transfer.fromAccount ?? "Origem"}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="font-medium text-slate-950">
                      {transfer.toProgram ?? transfer.toAccount ?? "Destino"}
                    </span>
                    <span className="text-slate-600">
                      {transfer.pointsSent.toLocaleString()} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <span>Visão operacional simplificada para uso diário.</span>
        <Link
          href="/app/inspection"
          className="text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
        >
          Diagnóstico avançado
        </Link>
      </div>
    </div>
  );
}

function CompactList({
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
  items: Array<{ label: string; detail: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel="Abrir tela"
            actionHref={emptyHref}
            supportingText="sem histórico"
          />
        ) : (
          items.slice(0, 4).map((item) => (
            <div
              key={`${item.label}-${item.detail}`}
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="text-sm font-medium text-slate-950">
                {item.label}
              </div>
              <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
