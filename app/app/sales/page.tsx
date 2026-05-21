export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getSalesOverview } from "../../../lib/data/sales";
import { getAccountsOverview } from "../../../lib/data/accounts";
import SaleForm from "../../../components/forms/sale-form";

export default async function SalesPage() {
  const sales = await getSalesOverview();
  const accounts = await getAccountsOverview();

  const revenueCents = sales.reduce(
    (acc: number, s: any) => acc + (s.revenueCents || 0),
    0,
  );
  const profitCents = sales.reduce(
    (acc: number, s: any) => acc + (s.profitCents || 0),
    0,
  );
  const milesSold = sales.reduce(
    (acc: number, s: any) => acc + (s.points || 0),
    0,
  );

  return (
    <div>
      <PageHeader title="Vendas" subtitle="Resumo e tabela de vendas" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-1">
          <SaleForm accounts={accounts} />
        </div>
        <div className="col-span-2">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded border">
              Faturamento
              <br />
              <strong>R$ {(revenueCents / 100).toFixed(2)}</strong>
            </div>
            <div className="bg-white p-4 rounded border">
              Lucro
              <br />
              <strong>R$ {(profitCents / 100).toFixed(2)}</strong>
            </div>
            <div className="bg-white p-4 rounded border">
              Milhas vendidas
              <br />
              <strong>{milesSold.toLocaleString()}</strong>
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
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-600">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                ) : (
                  sales.map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td>{s.id}</td>
                      <td>{s.status}</td>
                      <td>{s.points}</td>
                      <td>R$ {(s.revenueCents / 100).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
