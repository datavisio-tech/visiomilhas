"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AccountOperationalChartPoint } from "../../lib/data/programs";

type Props = {
  balanceSeries: AccountOperationalChartPoint[];
  flowSeries: AccountOperationalChartPoint[];
  periodLabel?: string;
  periodSeries?: AccountOperationalChartPoint[];
};

export default function ProgramChart({
  balanceSeries,
  flowSeries,
  periodLabel,
  periodSeries,
}: Props) {
  const chartSeries = periodSeries?.length ? periodSeries : balanceSeries;
  const flowChartSeries = periodSeries?.length ? periodSeries : flowSeries;

  return (
    <div className="grid gap-6">
      <div className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card transition-shadow duration-200 hover:shadow-card-hover">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-label-xs font-semibold text-slate-500">
              Saldo
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
              Evolução temporal da conta{periodLabel ? ` · ${periodLabel}` : ""}
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartSeries}
              margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="#d1fae5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card transition-shadow duration-200 hover:shadow-card-hover">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-label-xs font-semibold text-slate-500">
              Créditos x débitos
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
              Entradas e saídas por período
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={flowChartSeries}
              margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="credits" fill="#10b981" radius={[10, 10, 0, 0]} />
              <Bar dataKey="debits" fill="#f59e0b" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
