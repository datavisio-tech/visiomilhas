"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  PlusCircle,
  Search,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { Card } from "../ui/card";
import Badge from "../ui/badge";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import Select from "../ui/select";
import { PrimaryButton, SecondaryButton } from "../ui/button";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead as TH,
} from "../ui/table";
import AccountRow from "./account-row";
import NewAccountDialog from "./new-account-dialog";
import type {
  AccountOverview,
  AccountProgramOption,
} from "../../lib/data/accounts";

type DialogMode = "create" | "edit" | "view" | "inactive" | "delete";
type StatusFilter = "all" | "active" | "inactive";

export default function AccountList({
  accounts,
  programs,
}: {
  accounts: AccountOverview[];
  programs: AccountProgramOption[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedAccount, setSelectedAccount] =
    useState<AccountOverview | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeCount = useMemo(
    () => accounts.filter((account) => account.isActive).length,
    [accounts],
  );
  const averageCpm = useMemo(() => {
    const values = accounts
      .filter((account) => account.cpmCents > 0)
      .map((account) => account.cpmCents);
    if (!values.length) return 0;
    return Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }, [accounts]);
  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? account.isActive : !account.isActive);
      const haystack = [
        account.displayName,
        account.program,
        account.holderName,
        account.status,
        account.programSlug,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ");

      return (
        matchesStatus &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [accounts, query, statusFilter]);

  function openDialog(mode: DialogMode, account?: AccountOverview | null) {
    setDialogMode(mode);
    setSelectedAccount(account ?? null);
    setDialogOpen(true);
  }

  function openPrograms(account: AccountOverview) {
    router.push(`/app/programs?accountId=${account.id}`);
  }

  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {activeCount} ativas
        </Badge>
        <Badge>{accounts.length} contas</Badge>
        <Badge>
          CPM mÃ©dio:{" "}
          {averageCpm > 0 ? `R$ ${(averageCpm / 100).toFixed(2)}` : "â€”"}
        </Badge>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Lista de contas
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Busque por nome, programa, titular ou status.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <Badge
                className="border-slate-200 bg-slate-50 text-slate-700"
                role="status"
                aria-live="polite"
              >
                {filteredAccounts.length} visÃ­veis
              </Badge>
              <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                {statusFilter === "all"
                  ? "Todos os status"
                  : statusFilter === "active"
                    ? "Somente ativas"
                    : "Somente inativas"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <span
                suppressHydrationWarning
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              >
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </span>
              <Input
                aria-label="Buscar contas"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por programa, conta ou titular"
                className="pl-10"
              />
            </div>

            <div className="relative">
              <span
                suppressHydrationWarning
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              >
                <SlidersHorizontal
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </span>
              <Select
                aria-label="Filtrar por status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="pl-10"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </Select>
            </div>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="p-5">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center shadow-sm sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <WalletCards className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Primeiro passo
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Nenhuma conta operacional cadastrada
              </div>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                A conta é onde saldo, CPM e movimentos passam a existir. Crie a
                primeira para ligar o programa à operação e começar com a base
                certa.
              </p>

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <PlusCircle className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <div className="mt-3 text-sm font-semibold text-slate-950">
                    1. Escolha o programa
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Selecione um programa existente ou crie um novo pelo
                    catálogo dentro do formulário.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <ArrowRightLeft
                    className="h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div className="mt-3 text-sm font-semibold text-slate-950">
                    2. Defina a conta
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Use um apelido claro para diferenciar cada operação no dia a
                    dia.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <WalletCards className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <div className="mt-3 text-sm font-semibold text-slate-950">
                    3. Registre o saldo
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Se já houver pontos, lance o saldo inicial antes de seguir
                    para compras e transferências.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PrimaryButton onClick={() => setDialogOpen(true)}>
                  Nova conta
                </PrimaryButton>
                <SecondaryButton href="/app/programs">
                  Abrir programas
                </SecondaryButton>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Depois da primeira conta, o cockpit do programa e o saldo ficam
                prontos para uso.
              </p>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Nenhum resultado para os filtros"
              description="Ajuste a busca ou o filtro de status para voltar a enxergar contas na lista."
              supportingText={hasFilters ? "Busca e filtro ativos" : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TH>Programa</TH>
                  <TH>Conta</TH>
                  <TH className="text-right">Saldo</TH>
                  <TH className="text-right">CPM</TH>
                  <TH>Status</TH>
                  <TH>Atualizado</TH>
                  <TH className="w-14 text-right">&nbsp;</TH>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    programsHref={`/app/programs?accountId=${account.id}`}
                    handlers={{
                      onView: () => openPrograms(account),
                      onEdit: () => openDialog("edit", account),
                      onDelete: () => openDialog("delete", account),
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <NewAccountDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        programs={programs}
        account={selectedAccount}
      />
    </>
  );
}


