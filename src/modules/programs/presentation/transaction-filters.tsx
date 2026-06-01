"use client";

/* eslint-disable no-unused-vars */
import { Search } from "lucide-react";
import type { ProgramsCockpitPeriod } from "../../../../lib/data/programs";

type Props = {
  query: string;
  typeFilter:
    | "all"
    | "purchase"
    | "sale"
    | "transfer"
    | "subscription"
    | "adjustment"
    | "credit"
    | "debit";
  statusFilter: "all" | "pending" | "completed";
  period: ProgramsCockpitPeriod;
  onQueryChange: (value: string) => void;
  onTypeChange: (_value: Props["typeFilter"]) => void;
  onStatusChange: (_value: Props["statusFilter"]) => void;
  onPeriodChange: (_value: ProgramsCockpitPeriod) => void;
};

export function TransactionFilters({
  query,
  typeFilter,
  statusFilter,
  period,
  onQueryChange,
  onTypeChange,
  onStatusChange,
  onPeriodChange,
}: Props) {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-card lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <span suppressHydrationWarning aria-hidden="true">
          <Search className="h-4 w-4" />
        </span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar no extrato"
          className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
        />
      </label>

      <select
        value={typeFilter}
        onChange={(event) =>
          onTypeChange(event.target.value as Props["typeFilter"])
        }
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
      >
        <option value="all">Todos os tipos</option>
        <option value="purchase">Compra</option>
        <option value="sale">Venda</option>
        <option value="transfer">Transferência</option>
        <option value="subscription">Assinatura</option>
        <option value="credit">Crédito</option>
        <option value="debit">Débito</option>
        <option value="adjustment">Ajuste</option>
      </select>

      <select
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value as Props["statusFilter"])
        }
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
      >
        <option value="all">Todos os status</option>
        <option value="completed">Concluídos</option>
        <option value="pending">Pendentes</option>
      </select>

      <select
        value={period}
        onChange={(event) =>
          onPeriodChange(event.target.value as ProgramsCockpitPeriod)
        }
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
      >
        <option value="30d">30 dias</option>
        <option value="90d">90 dias</option>
        <option value="12m">12 meses</option>
      </select>
    </div>
  );
}
