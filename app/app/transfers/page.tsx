export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getTransfersOverview } from "../../../lib/data/transfers";

export default async function TransfersPage() {
  const transfers = await getTransfersOverview();

  return (
    <div>
      <PageHeader title="Transferências" subtitle="Envios entre programas" />
      <div className="bg-white p-4 rounded border">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th>Origem</th>
              <th>Destino</th>
              <th>Enviados</th>
              <th>Bônus</th>
              <th>Recebidos</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-gray-600">
                  Nenhuma transferência encontrada.
                </td>
              </tr>
            ) : (
              transfers.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td>{t.fromProgram || t.fromAccount}</td>
                  <td>{t.toProgram || t.toAccount}</td>
                  <td>{t.pointsSent.toLocaleString()}</td>
                  <td>{t.bonusPercent}%</td>
                  <td>{t.pointsReceived.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
