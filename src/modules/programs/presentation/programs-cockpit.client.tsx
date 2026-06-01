"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  HandCoins,
  Repeat,
  Settings2,
} from "lucide-react";
import EmptyState from "../../../../components/ui/empty-state";
import {
  PrimaryButton,
  SecondaryButton,
} from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";
import Dialog, {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import PurchaseForm from "../../../../components/forms/purchase-form";
import SaleForm from "../../../../components/forms/sale-form";
import TransferForm from "../../../../components/forms/transfer-form";
import ProgramChart from "../../../../components/programs/program-chart";
import AccountOperationalSelector from "../../../../components/programs/account-operational-selector";
import { TransactionTable } from "./transaction-table";
import { TransactionFilters } from "./transaction-filters";
import { TransactionDetails } from "./transaction-details";
import { TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import type { ProgramsCockpitView } from "../application/resolve-programs-cockpit";
import {
  PROGRAMS_COCKPIT_PERIODS,
  PROGRAMS_COCKPIT_TABS,
  type ProgramsCockpitTab,
} from "../domain/programs-cockpit";

type Props = { view: ProgramsCockpitView };

export function ProgramsCockpitClient({ view }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<
    | "all"
    | "purchase"
    | "sale"
    | "transfer"
    | "subscription"
    | "adjustment"
    | "credit"
    | "debit"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [action, setAction] = useState<
    "purchase" | "sale" | "transfer" | "subscriptions" | null
  >(null);

  const account = view.account;
  const selectedPeriod = view.selectedPeriod;
  const selectedPeriodLabel =
    PROGRAMS_COCKPIT_PERIODS.find((p) => p.id === selectedPeriod)?.label ??
    selectedPeriod;
  const selectedTab = view.selectedTab;
  const statement = view.statement;
  const pendingTransfers = view.transfers.filter((item) =>
    isOpenStatus(item.status),
  );
  const statementPurchases = statement.filter(
    (item) => item.kind === "purchase",
  );
  const statementSales = statement.filter((item) => item.kind === "sale");
  const activeSubscriptions = view.subscriptions.filter((item) =>
    isActiveSubscriptionStatus(item.status),
  );
  const formAccounts = view.accounts.map((item) => ({
    ...item,
    nickname: item.nickname ?? item.displayName,
  }));
  const selectedRow = useMemo(
    () =>
      statement.find((row) => row.id === selectedRowId) ?? statement[0] ?? null,
    [statement, selectedRowId],
  );

  const filteredStatement = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return statement.filter((row) => {
      const matchesType =
        movementTypeFilter === "all" || row.kind === movementTypeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending"
          ? isOpenStatus(row.status)
          : !isOpenStatus(row.status));
      const matchesQuery =
        !normalizedQuery ||
        `${row.title} ${row.description} ${row.status} ${row.origin} ${row.operationLabel}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [movementTypeFilter, query, statusFilter, statement]);

  if (!account) {
    return (
      <EmptyState
        title="Nenhuma conta operacional encontrada"
        description="Crie uma conta em Accounts para abrir o cockpit operacional do programa."
        actionLabel="Ir para Contas"
        actionHref="/app/accounts"
      />
    );
  }

  function updateSearchParams(next: {
    accountId?: string;
    tab?: ProgramsCockpitTab;
    period?: string;
  }) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (next.accountId) nextSearchParams.set("accountId", next.accountId);
    if (next.tab) nextSearchParams.set("tab", next.tab);
    if (next.period) nextSearchParams.set("period", next.period);
    router.replace(`${pathname}?${nextSearchParams.toString()}`);
  }

  const quickActions = [
    { id: "purchase" as const, label: "Compra", icon: HandCoins },
    { id: "sale" as const, label: "Venda", icon: Banknote },
    { id: "transfer" as const, label: "Transferência", icon: Repeat },
    { id: "subscriptions" as const, label: "Assinaturas", icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card xl:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-3">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link
                href="/app/accounts"
                className="hover:text-slate-950 hover:underline"
              >
                Contas
              </Link>
              <span className="text-slate-300">›</span>
              <span className="font-semibold text-slate-800">
                {account.displayName}
              </span>
            </nav>

            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Operacional
                </div>
                <h1 className="text-3xl font-bold leading-tight text-slate-950 xl:text-[2rem]">
                  {account.displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 xl:text-base">
                  {account.program ?? "Programa sem nome"} · cockpit operacional
                  da conta com foco em saldo, extrato e acompanhamento de fluxo.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <HeaderMetric
                label="Saldo"
                value={`${account.balance.toLocaleString("pt-BR")} pts`}
              />
              <HeaderMetric
                label="CPM"
                value={`R$ ${(account.cpmCents / 100).toFixed(2)}`}
              />
              <HeaderMetric
                label="Valor financeiro"
                value={formatMoney(view.metrics.financialValueCents)}
              />
              <HeaderMetric
                label="Última movimentação"
                value={formatDate(view.metrics.lastMovementAt)}
              />
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 xl:w-[320px] xl:shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Conta ativa
              </div>
              <AccountOperationalSelector
                accounts={view.accounts.filter(
                  (item) => item.isActive || item.id === account.id,
                )}
                selectedAccountId={account.id}
                compact
                onChange={(accountId) =>
                  updateSearchParams({
                    accountId: String(accountId),
                    tab: selectedTab,
                    period: selectedPeriod,
                  })
                }
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link
                href="/app/accounts"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                <span suppressHydrationWarning aria-hidden="true">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Trocar conta
              </Link>

              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {account.isActive ? "Conta ativa" : "Conta inativa"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <PrimaryButton
                    key={item.id}
                    className="flex-1 bg-slate-950 px-3 py-2 text-sm text-white hover:bg-slate-800 xl:flex-none"
                    onClick={() => setAction(item.id)}
                  >
                    <span suppressHydrationWarning aria-hidden="true">
                      <Icon className="mr-2 h-4 w-4" />
                    </span>
                    {item.label}
                  </PrimaryButton>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Indicadores operacionais
                  </div>
                  <CardTitle className="mt-1 text-lg text-slate-950">
                    Resumo executivo do período
                  </CardTitle>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {selectedPeriodLabel}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <OperationalCard
                title="Compras no período"
                value={`${statementPurchases.length}`}
                description="Movimentos de entrada"
              />
              <OperationalCard
                title="Vendas no período"
                value={`${statementSales.length}`}
                description="Movimentos de saída"
              />
              <OperationalCard
                title="Transferências no período"
                value={`${statement.filter((item) => item.kind === "transfer").length}`}
                description="Lançamentos entre contas"
              />
              <OperationalCard
                title="Resultado líquido"
                value={formatMoney(view.metrics.resultOperationalCents)}
                description="Receita menos custos e taxas"
              />
            </CardContent>
          </Card>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
            <TabsList>
              {PROGRAMS_COCKPIT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  active={selectedTab === tab.id}
                  onClick={() =>
                    updateSearchParams({ tab: tab.id, period: selectedPeriod })
                  }
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedTab === "movements" || selectedTab === "statement" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Extrato operacional
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-950">
                        O que aconteceu nesta conta?
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      Movimentos cronológicos, com origem, tipo e status.
                    </div>
                  </div>
                </div>

                <TransactionFilters
                  query={query}
                  typeFilter={movementTypeFilter}
                  statusFilter={statusFilter}
                  period={selectedPeriod}
                  onQueryChange={setQuery}
                  onTypeChange={setMovementTypeFilter}
                  onStatusChange={setStatusFilter}
                  onPeriodChange={(period) =>
                    updateSearchParams({ tab: selectedTab, period })
                  }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                  <TransactionTable
                    rows={filteredStatement}
                    selectedId={selectedRow?.id}
                    onSelect={(row) => setSelectedRowId(row.id)}
                  />
                  <TransactionDetails row={selectedRow} />
                </div>

                {statement.length >= 5 ? (
                  <ProgramChart
                    balanceSeries={view.charts.balanceSeries}
                    flowSeries={view.charts.flowSeries}
                    periodLabel={selectedPeriod}
                    periodSeries={view.charts.periods[selectedPeriod]}
                  />
                ) : (
                  <Card className="border-dashed border-slate-200 bg-slate-50">
                    <CardContent className="p-6 text-sm text-slate-500">
                      Dados insuficientes para análise gráfica.
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}

            {selectedTab === "summary" ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <ListCard
                  title="Últimas movimentações"
                  emptyLabel="Nenhuma movimentação encontrada."
                  items={filteredStatement
                    .slice(0, 5)
                    .map(
                      (item) =>
                        `${formatDate(item.date)} · ${item.operationLabel} · ${item.points >= 0 ? "+" : ""}${item.points.toLocaleString("pt-BR")} pts`,
                    )}
                />
                <Card className="border-slate-200 bg-slate-50">
                  <CardHeader>
                    <CardTitle>Resumo executivo</CardTitle>
                    <CardDescription>
                      A leitura principal está na aba Movimentações.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <p>
                      O cockpit agora prioriza o extrato operacional, deixando
                      gráficos e contexto como apoio.
                    </p>
                    <p>
                      Use o filtro por tipo e status para localizar compras,
                      vendas, transferências e assinaturas.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {selectedTab === "charts" ? (
              <div className="mt-6">
                {statement.length >= 5 ? (
                  <ProgramChart
                    balanceSeries={view.charts.balanceSeries}
                    flowSeries={view.charts.flowSeries}
                    periodLabel={selectedPeriod}
                    periodSeries={view.charts.periods[selectedPeriod]}
                  />
                ) : (
                  <Card className="border-dashed border-slate-200 bg-slate-50">
                    <CardContent className="p-6 text-sm text-slate-500">
                      Dados insuficientes para análise gráfica.
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}

            {selectedTab === "pending" ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <ListCard
                  title="Compras pendentes"
                  emptyLabel="Nenhuma compra pendente."
                  items={view.pendingPurchases.map(
                    (item) =>
                      `${item.description ?? "Compra"} · ${item.points.toLocaleString("pt-BR")} pts`,
                  )}
                />
                <ListCard
                  title="Transferências em aberto"
                  emptyLabel="Nenhuma transferência em aberto."
                  items={view.transfers.map(
                    (item) =>
                      `${item.description ?? "Transferência"} · ${item.pointsSent.toLocaleString("pt-BR")} pts`,
                  )}
                />
              </div>
            ) : null}

            {selectedTab === "subscriptions" ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <ListCard
                  title="Assinaturas ativas"
                  emptyLabel="Nenhuma assinatura ativa."
                  items={view.subscriptions.map(
                    (item) =>
                      `${item.planName ?? item.planCode ?? "Plano"} · ${item.status}`,
                  )}
                />
                <Card className="border-slate-200 bg-slate-50">
                  <CardHeader>
                    <CardTitle>Gestão da assinatura</CardTitle>
                    <CardDescription>
                      Abra o fluxo de assinatura ou consulte a área de
                      programas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SecondaryButton href="/app/subscribe" className="w-full">
                      Ir para assinatura
                    </SecondaryButton>
                    <SecondaryButton href="/app/clubs" className="w-full">
                      Abrir clubes
                    </SecondaryButton>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Conta</CardTitle>
              <CardDescription>
                Contexto operacional da conta selecionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <SideMetric label="Programa" value={account.program ?? "—"} />
              <SideMetric
                label="Status"
                value={account.isActive ? "Ativa" : "Inativa"}
              />
              <SideMetric
                label="Última atualização"
                value={formatDate(view.metrics.lastMovementAt)}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Pendências</CardTitle>
              <CardDescription>
                Fluxos aguardando crédito ou confirmação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <SideMetric
                label="Compras pendentes"
                value={`${view.pendingPurchases.length}`}
              />
              <SideMetric
                label="Transferências abertas"
                value={`${pendingTransfers.length}`}
              />
              <SideMetric
                label="Pontos aguardando crédito"
                value={`${view.metrics.pointsReceivable.toLocaleString("pt-BR")} pts`}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Assinaturas</CardTitle>
              <CardDescription>
                Leitura rápida do ciclo comercial da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <SideMetric
                label="Clubes ativos"
                value={`${activeSubscriptions.length}`}
              />
              <SideMetric
                label="Renovações"
                value={
                  view.subscriptions.some((item) => item.trialEndsAt)
                    ? "Com vigência"
                    : "Sem vigência"
                }
              />
              <SideMetric
                label="Custos mensais"
                value={`${view.subscriptions.length} assinatura(s) monitoradas`}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        isOpen={action !== null}
        onOpenChange={(open) => setAction(open ? action : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "purchase"
                ? "Nova compra"
                : action === "sale"
                  ? "Nova venda"
                  : action === "transfer"
                    ? "Nova transferência"
                    : "Assinaturas"}
            </DialogTitle>
            <DialogDescription>
              A ação abre os fluxos operacionais já existentes, já contextuados
              pela conta selecionada.
            </DialogDescription>
          </DialogHeader>

          {action === "purchase" ? (
            <PurchaseForm
              accounts={formAccounts}
              defaultAccountId={account.id}
            />
          ) : null}
          {action === "sale" ? (
            <SaleForm accounts={formAccounts} defaultAccountId={account.id} />
          ) : null}
          {action === "transfer" ? (
            <TransferForm
              accounts={formAccounts}
              defaultAccountId={account.id}
            />
          ) : null}
          {action === "subscriptions" ? (
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                As assinaturas desta organização estão listadas na aba de
                assinaturas e na visão de clubes.
              </p>
              <div className="flex flex-wrap gap-3">
                <SecondaryButton href="/app/subscribe">
                  Abrir assinatura
                </SecondaryButton>
                <SecondaryButton href="/app/clubs">
                  Ir para clubes
                </SecondaryButton>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <SecondaryButton onClick={() => setAction(null)}>
              Fechar
            </SecondaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function OperationalCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-slate-500">{description}</div>
    </div>
  );
}

function SideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function isOpenStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("pend") ||
    normalized.includes("open") ||
    normalized.includes("await") ||
    normalized.includes("processing") ||
    normalized.includes("analysis") ||
    normalized.includes("aguard")
  );
}

function isActiveSubscriptionStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("active") ||
    normalized.includes("trial") ||
    normalized.includes("ativa")
  );
}

function ListCard({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-3 text-sm text-slate-600">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">{emptyLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}
