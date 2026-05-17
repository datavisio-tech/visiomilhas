import PageHeader from "../../../components/ui/page-header";
import { getClubsOverview } from "../../../lib/data/clubs";

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const clubs = await getClubsOverview();

  return (
    <div>
      <PageHeader title="Clubes" subtitle="Assinaturas e benefícios" />
      <div className="grid grid-cols-3 gap-4">
        {clubs.length === 0 ? (
          <div className="col-span-3 bg-white p-4 rounded border text-gray-600">
            Nenhum clube configurado — vazio seguro para desenvolvimento.
          </div>
        ) : (
          clubs.map((c: any) => (
            <div key={c.id} className="bg-white p-4 rounded border">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">
                {c.baseMonthlyPoints} pts base • R${" "}
                {(c.monthlyAmountCents / 100).toFixed(2)} / mês
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
