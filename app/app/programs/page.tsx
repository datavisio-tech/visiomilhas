import PageHeader from "../../../components/ui/page-header";
import { programs } from "../../../lib/mock/visiomilhas-data";

export default function ProgramsPage() {
  return (
    <div>
      <PageHeader
        title="Programas"
        subtitle="Gerencie seus programas de fidelidade"
      />
      <div className="grid grid-cols-3 gap-4">
        {programs.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded border">
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
