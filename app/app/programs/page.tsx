export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getProgramsOverview } from "../../../lib/data/programs";

export default async function ProgramsPage() {
  const programs = await getProgramsOverview();

  return (
    <div>
      <PageHeader
        title="Programas"
        subtitle="Gerencie seus programas de fidelidade"
      />
      <div className="grid grid-cols-3 gap-4">
        {programs.length === 0 ? (
          <div className="col-span-3 bg-white p-4 rounded border text-gray-600">
            Nenhum programa encontrado.
          </div>
        ) : (
          programs.map((p: any) => (
            <div key={p.id} className="bg-white p-4 rounded border">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">{p.type}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
