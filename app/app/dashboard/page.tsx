export const dynamic = "force-dynamic";

import MetricCard from "../../../components/dashboard/metric-card";
import DashboardChart from "../../../components/dashboard/dashboard-chart";
import TrialBanner from "../../../components/layout/trial-banner";
import {
  getMetrics,
  getRecentEntries,
  getRecentPurchases,
} from "../../../lib/server/dashboard";

export default async function DashboardPage() {
  const metrics = await getMetrics();
  const recentEntries = await getRecentEntries();
  const purchases = await getRecentPurchases();

  return (
    <div>
      <TrialBanner />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Saldo total"
          value={`${metrics.totalBalance.toLocaleString()} pts`}
        />
        <MetricCard
          title="Custo médio do milheiro"
          value={`R$ ${(metrics.avgCpmCents / 100).toFixed(2)}`}
        />
        <MetricCard
          title="Pontos a receber"
          value={`${metrics.pointsToReceive.toLocaleString()} pts`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <DashboardChart />
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Lançamentos recentes</h3>
            <ul className="text-sm text-gray-700">
              {recentEntries.map((e: any) => (
                <li key={e.id} className="py-1">
                  {e.date} — {e.description} — {e.points} pts — {e.status}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Compras recentes</h3>
            <ul className="text-sm text-gray-700">
              {purchases.map((p: any) => (
                <li key={p.id} className="py-1">
                  {p.status} — {p.points} pts — R${" "}
                  {(p.valueCents / 100).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
