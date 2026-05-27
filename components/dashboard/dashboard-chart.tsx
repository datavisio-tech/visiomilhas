"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Jan", revenue: 50000, profit: 12000 },
  { name: "Feb", revenue: 62000, profit: 14500 },
  { name: "Mar", revenue: 73000, profit: 19000 },
  { name: "Apr", revenue: 81000, profit: 24400 },
  { name: "May", revenue: 89500, profit: 29800 },
];

export default function DashboardChart() {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-card-p-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 h-80">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-label-xs font-semibold text-slate-500">
            Receita e lucro
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-950">
            Operação últimos 5 meses
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-label-sm font-semibold text-emerald-700 flex-shrink-0">
          Operacional
        </div>
      </div>

      <div className="h-[calc(100%-5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 16, right: 12, bottom: 0, left: -8 }}
          >
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
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2 }}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
