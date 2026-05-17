export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import { getAccountsOverview } from "../../../lib/data/accounts";

export default async function AccountsPage() {
  const accounts = await getAccountsOverview();

  return (
    <div>
      <PageHeader title="Contas" subtitle="Contas por programa" />
      <div className="bg-white p-4 rounded border">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
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
                <td colSpan={4} className="py-4 text-gray-600">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              accounts.map((a: any) => (
                <tr key={a.id} className="border-t">
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
