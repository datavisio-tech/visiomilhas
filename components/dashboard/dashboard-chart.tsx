"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", revenue: 50000, profit: 12000 },
  { name: "Feb", revenue: 60000, profit: 15000 },
  { name: "Mar", revenue: 70000, profit: 20000 },
  { name: "Apr", revenue: 80000, profit: 25000 },
  { name: "May", revenue: 90000, profit: 30000 },
];

export default function DashboardChart() {
  return (
    <div className="bg-white p-4 rounded shadow-sm border h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#7c3aed"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#06b6d4"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
