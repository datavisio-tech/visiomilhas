export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getPurchasesOverview } from "../../../lib/data/purchases";
import { getAccountsOverview } from "../../../lib/data/accounts";
import PurchaseForm from "../../../components/forms/purchase-form";

export default async function PurchasesPage() {
  const purchases = await getPurchasesOverview();
  const accounts = await getAccountsOverview();

  return (
    <div>
      <PageHeader title="Compras" subtitle="Gerencie compras de pontos" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <PurchaseForm accounts={accounts} />
        </div>
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {purchases.length === 0 ? (
              <div className="col-span-2 bg-white p-4 rounded border text-gray-600">
                Nenhuma compra encontrada.
              </div>
            ) : (
              purchases.map((p: any) => (
                <div key={p.id} className="bg-white p-4 rounded border">
                  <div className="font-semibold">{p.status}</div>
                  <div className="text-sm">{p.points.toLocaleString()} pts</div>
                  <div className="text-sm">
                    R$ {(p.valueCents / 100).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
