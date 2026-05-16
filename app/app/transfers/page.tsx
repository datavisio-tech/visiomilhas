import PageHeader from "../../../components/ui/page-header";
import { transfers } from "../../../lib/mock/visiomilhas-data";

export default function TransfersPage() {
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
            {transfers.map((t) => (
              <tr key={t.id} className="border-t">
                <td>{t.from}</td>
                <td>{t.to}</td>
                <td>{t.pointsSent}</td>
                <td>{t.bonusPercent}%</td>
                <td>{t.pointsReceived}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
