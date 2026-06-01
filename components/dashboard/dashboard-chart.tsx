"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type DashboardChartPoint = {
  name: string;
  revenue: number;
  profit: number;
};

type DashboardChartProps = {
  data: DashboardChartPoint[];
  revenueTotalCents: number;
  trendLabel: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function DashboardChart({
  data,
  revenueTotalCents,
  trendLabel,
}: DashboardChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="flex h-80 flex-col overflow-hidden rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="text-label-xs font-semibold text-slate-500">
            Receita e margem
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            Tempo de operação mensal
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-label-sm font-semibold text-slate-700 flex-shrink-0">
          Visão operacional
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="text-label-xs uppercase tracking-[0.18em] text-slate-500">
            Receita total
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {formatMoney(revenueTotalCents)}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="text-label-xs uppercase tracking-[0.18em] text-slate-500">
            Tendência de lucro
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {trendLabel}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, bottom: 0, left: -8 }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  color: "#0f172a",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.1)",
                }}
                labelStyle={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}
                itemStyle={{ color: "#0f172a", fontSize: 13 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10 }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div>
              <div className="text-sm font-semibold text-slate-950">
                Nenhuma venda concluída ainda
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quando houver vendas na organização atual, a receita e a
                tendência aparecem aqui.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
