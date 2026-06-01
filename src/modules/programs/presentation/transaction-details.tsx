import type { AccountOperationalStatementItem } from "../../../../lib/data/programs";

type Props = {
  row: AccountOperationalStatementItem | null;
};

function formatMoneyCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR");
}

export function TransactionDetails({ row }: Props) {
  if (!row) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-card">
        Selecione um lançamento no extrato para ver o detalhe operacional.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Detalhe do lançamento
      </div>
      <div className="mt-3 text-lg font-semibold text-slate-950">
        {row.title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{row.description}</p>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Fact label="Data/Hora" value={formatDate(row.date)} />
        <Fact label="Origem" value={row.origin} />
        <Fact label="Tipo" value={row.operationLabel} />
        <Fact label="Pontos" value={row.points.toLocaleString("pt-BR")} />
        <Fact
          label="Valor financeiro"
          value={formatMoneyCents(row.financialValueCents)}
        />
        <Fact label="CPM" value={formatMoneyCents(row.cpmCents)} />
        <Fact
          label="Saldo após"
          value={row.balanceAfterPoints.toLocaleString("pt-BR")}
        />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}
