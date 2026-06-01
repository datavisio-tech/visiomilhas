"use client";

import MetricCard from "../dashboard/metric-card";

type Summary = {
  balance?: number;
  cpmCents?: number;
  resultOperationalCents?: number;
  pointsReceivable?: number;
  financialValueCents?: number;
};

type Props = {
  summary?: Summary;
};

export default function ProgramKPIs({ summary }: Props) {
  const bal = summary?.balance ?? 0;
  const cpmCents = summary?.cpmCents ?? 0;
  const resultOperationalCents = summary?.resultOperationalCents ?? 0;
  const pointsReceivable = summary?.pointsReceivable ?? 0;
  const financialValueCents = summary?.financialValueCents ?? 0;

  const formatPoints = new Intl.NumberFormat("pt-BR").format(bal);

  const formatMoney = (valueCents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(valueCents / 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        title="Saldo do programa"
        value={`${formatPoints} pts`}
        caption="Saldo atual da conta"
      />
      <MetricCard
        title="CPM Médio"
        value={`R$ ${(cpmCents / 100).toFixed(2)}`}
        caption="Custo por mil pontos"
      />
      <MetricCard
        title="Resultado Operacional"
        value={formatMoney(resultOperationalCents)}
        caption="Receita menos custo e taxas"
        tone={resultOperationalCents >= 0 ? "success" : "danger"}
      />
      <MetricCard
        title="Pontos a Receber"
        value={pointsReceivable}
        caption="Movimentos pendentes"
        tone="warning"
      />
      <MetricCard
        title="Valor Financeiro"
        value={formatMoney(financialValueCents)}
        caption="Saldo convertido por CPM"
      />
    </div>
  );
}
