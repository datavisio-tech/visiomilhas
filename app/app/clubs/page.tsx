import PageHeader from "../../../components/ui/page-header";
import { clubs } from "../../../lib/mock/visiomilhas-data";

export default function ClubsPage() {
  return (
    <div>
      <PageHeader title="Clubes" subtitle="Assinaturas e benefícios" />
      <div className="grid grid-cols-3 gap-4">
        {clubs.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded border">
            {c.name}
            <div className="text-sm text-gray-600">
              {c.monthlyPoints} pts / mês — R${" "}
              {(c.monthlyFeeCents / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
