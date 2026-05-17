export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getEntriesOverview } from "../../../lib/data/entries";

export default async function EntriesPage() {
  const entries = await getEntriesOverview();

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
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-gray-600">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              entries.map((e: any) => (
                <tr key={e.id} className="border-t">
                  <td>{e.date}</td>
                  <td>{e.program ?? "—"}</td>
                  <td>{e.account ?? "—"}</td>
                  <td>{e.type}</td>
                  <td>{e.points.toLocaleString()}</td>
                  <td>{e.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
