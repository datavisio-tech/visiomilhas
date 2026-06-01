export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import { getTransfersOverview } from "../../../lib/data/transfers";
import { getAccountsOverview } from "../../../lib/data/accounts";
import TransferForm from "../../../components/forms/transfer-form";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";

export default async function TransfersPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "transfers.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/transfers");
  const transfers = await getTransfersOverview(sessionContext);
  const accounts = await getAccountsOverview(sessionContext);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Transferências"
        subtitle="Movimente pontos entre programas com clareza de origem, destino e bônus aplicado."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-1">
          <TransferForm accounts={accounts} />
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
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
                  <td colSpan={5} className="py-4">
                    <EmptyState
                      title="Nenhuma transferência registrada"
                      description="Use a primeira transferência quando quiser ajustar o saldo entre programas sem perder a rastreabilidade."
                      actionLabel="Abrir inspeção"
                      actionHref="/app/inspection"
                      supportingText="sem transferências ainda"
                    />
                  </td>
                </tr>
              ) : (
                transfers.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-200">
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
    </div>
  );
}
