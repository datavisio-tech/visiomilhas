export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import { getAccountsOverview } from "../../../lib/data/accounts";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "accounts.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/accounts");
  const accounts = await getAccountsOverview(sessionContext);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Setup"
        title="Contas"
        subtitle="Veja as contas vinculadas a programas e mantenha o ponto de partida operacional bem definido."
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th>Programa</th>
              <th>Apelido</th>
              <th>Saldo</th>
              <th>CPM</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4">
                  <EmptyState
                    title="Nenhuma conta encontrada"
                    description="Crie a primeira conta para começar a registrar compras, vendas e transferências com contexto operacional completo."
                    actionLabel="Abrir onboarding"
                    actionHref="/app/onboarding"
                    supportingText="base inicial"
                  />
                </td>
              </tr>
            ) : (
              accounts.map((a: any) => (
                <tr key={a.id} className="border-t border-slate-200">
                  <td>{a.program ?? "—"}</td>
                  <td>{a.nickname}</td>
                  <td>{a.balance.toLocaleString()}</td>
                  <td>R$ {(a.cpmCents / 100).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
