import PageHeader from "../../../components/ui/page-header";
import { sales, metrics } from "../../../lib/mock/visiomilhas-data";

export default function SalesPage() {
  return (
    <div>
      <PageHeader title="Vendas" subtitle="Resumo e tabela de vendas" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded border">
          Faturamento
          <br />
          <strong>R$ {(metrics.revenueCents / 100).toFixed(2)}</strong>
        </div>
        <div className="bg-white p-4 rounded border">
          Lucro
          <br />
          <strong>R$ {(metrics.profitCents / 100).toFixed(2)}</strong>
        </div>
        <div className="bg-white p-4 rounded border">
          Milhas vendidas
          <br />
          <strong>{metrics.milesSold.toLocaleString()}</strong>
        </div>
      </div>
      <div className="bg-white p-4 rounded border">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th>Id</th>
              <th>Status</th>
              <th>Pontos</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t">
                <td>{s.id}</td>
                <td>{s.status}</td>
                <td>{s.points}</td>
                <td>R$ {(s.valueCents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
