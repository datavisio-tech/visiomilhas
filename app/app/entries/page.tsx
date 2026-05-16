import PageHeader from "../../../components/ui/page-header";
import { recentEntries } from "../../../lib/mock/visiomilhas-data";

export default function EntriesPage() {
  return (
    <div>
      <PageHeader
        title="Lançamentos"
        subtitle="Últimos lançamentos e filtros"
      />
      <div className="bg-white p-4 rounded border">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th>Data</th>
              <th>Programa</th>
              <th>Conta</th>
              <th>Tipo</th>
              <th>Pontos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentEntries.map((e) => (
              <tr key={e.id} className="border-t">
                <td>{e.date}</td>
                <td>{e.program}</td>
                <td>{e.account}</td>
                <td>{e.type}</td>
                <td>{e.points}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
