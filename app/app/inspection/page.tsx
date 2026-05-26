export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import PageHeader from "../../../components/ui/page-header";
import InspectionPanel from "../../../components/inspection/inspection-panel";
import { getAccountsOverview } from "../../../lib/data/accounts";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";

export default async function InspectionPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "inspection.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/inspection");

  const accounts = await getAccountsOverview(sessionContext);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inspeção financeira"
        subtitle="Resumo operacional, warnings e troubleshooting guiado"
      />
      <InspectionPanel accounts={accounts} />
    </div>
  );
}
