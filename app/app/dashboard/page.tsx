import MetricCard from "../../../components/dashboard/metric-card";
import DashboardChart from "../../../components/dashboard/dashboard-chart";
import {
  metrics,
  recentEntries,
  purchases,
} from "../../../lib/mock/visiomilhas-data";
import TrialBanner from "../../../components/layout/trial-banner";

export default function DashboardPage() {
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
          value={`R$ ${(metrics.cpmCents / 100).toFixed(2)}`}
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
              {recentEntries.slice(0, 5).map((e) => (
                <li key={e.id} className="py-1">
                  {e.date} — {e.program} — {e.type} — {e.points} pts —{" "}
                  {e.status}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Compras pendentes</h3>
            <ul className="text-sm text-gray-700">
              {purchases.map((p) => (
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
