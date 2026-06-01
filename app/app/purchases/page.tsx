export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import PageHeader from "../../../components/ui/page-header";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { PurchasesDashboardViewModel } from "../../../src/modules/purchases/presentation/purchases-dashboard.viewmodel";
import PurchasesCockpit from "../../../src/modules/purchases/ui/PurchasesCockpit.client";
import NewPurchaseDrawer from "../../../src/modules/purchases/ui/NewPurchaseDrawer.client";

export default async function PurchasesPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "purchases.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/purchases");

  const organizationId = sessionContext.ownership.organizationId ?? 1;
  const vm = new PurchasesDashboardViewModel(organizationId);
  const [kpis, list] = await Promise.all([vm.kpis(), vm.list({}, 50, 0)]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ferramentas"
        title="Compras Bonificadas"
        subtitle="Controle suas compras bonificadas e acompanhe o crédito dos seus pontos."
        actions={<NewPurchaseDrawer organizationId={organizationId} />}
      />
      <PurchasesCockpit
        organizationId={organizationId}
        initialKpis={kpis}
        initialList={list}
      />
    </div>
  );
}
