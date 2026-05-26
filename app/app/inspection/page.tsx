export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
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
        eyebrow="Operação"
        title="Inspeção financeira"
        subtitle="Resumo operacional, warnings e troubleshooting guiado para validar saldo, FIFO e replay com linguagem humana."
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="Sem contas para inspecionar"
          description="Crie a primeira conta para desbloquear a inspeção operacional, o replay e os workflows de recovery."
          actionLabel="Abrir onboarding"
          actionHref="/app/onboarding"
          supportingText="sem inspeções ainda"
        />
      ) : (
        <InspectionPanel accounts={accounts} />
      )}
    </div>
  );
}
