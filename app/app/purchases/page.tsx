import PageHeader from "../../../components/ui/page-header";
import { purchases } from "../../../lib/mock/visiomilhas-data";

export default function PurchasesPage() {
  return (
    <div>
      <PageHeader title="Compras" subtitle="Gerencie compras de pontos" />
      <div className="grid grid-cols-3 gap-4">
        {purchases.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded border">
            {p.status} — {p.points} pts — R$ {(p.valueCents / 100).toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
