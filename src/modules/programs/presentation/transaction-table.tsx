/* eslint-disable no-unused-vars */
"use client";

import type { AccountOperationalStatementItem } from "../../../../lib/data/programs";

type Props = {
  rows: AccountOperationalStatementItem[];
  selectedId?: string | null;
  onSelect?: (row: AccountOperationalStatementItem) => void;
};

function formatPoints(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatMoneyCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR");
}

export function TransactionTable({ rows, selectedId, onSelect }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-card">
        Nenhum lançamento encontrado para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-4 font-semibold">Data/Hora</th>
              <th className="px-4 py-4 font-semibold">Origem</th>
              <th className="px-4 py-4 font-semibold">Tipo</th>
              <th className="px-4 py-4 font-semibold">Descrição</th>
              <th className="px-4 py-4 font-semibold">Pontos</th>
              <th className="px-4 py-4 font-semibold">CPM</th>
              <th className="px-4 py-4 font-semibold">Valor</th>
              <th className="px-4 py-4 font-semibold">Saldo após</th>
              <th className="px-4 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const active = selectedId === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect?.(row)}
                  className={`cursor-pointer transition ${
                    active ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(row.date)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{row.origin}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {row.operationLabel}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {row.description}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {formatPoints(row.points)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatMoneyCents(row.cpmCents)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatMoneyCents(row.financialValueCents)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {formatPoints(row.balanceAfterPoints)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.tone === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : row.tone === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
