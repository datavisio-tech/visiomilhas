export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import { getSalesOverview } from "../../../lib/data/sales";
import { getAccountsOverview } from "../../../lib/data/accounts";
import SaleForm from "../../../components/forms/sale-form";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";

export default async function SalesPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "sales.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/sales");
  const sales = await getSalesOverview(sessionContext);
  const accounts = await getAccountsOverview(sessionContext);

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
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Vendas"
        subtitle="Liquide pontos com leitura de faturamento, lucro e volume vendido em um fluxo simples."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-1">
          <SaleForm accounts={accounts} />
        </div>
        <div className="col-span-2">
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Faturamento</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">R$ {(revenueCents / 100).toFixed(2)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lucro</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">R$ {(profitCents / 100).toFixed(2)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Milhas vendidas</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{milesSold.toLocaleString()}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
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
                    <td colSpan={4} className="py-4">
                      <EmptyState
                        title="Nenhuma venda registrada"
                        description="Abra a tela de vendas quando quiser realizar a primeira liquidação operacional."
                        actionLabel="Abrir onboarding"
                        actionHref="/app/onboarding"
                        supportingText="sem histórico ainda"
                      />
                    </td>
                  </tr>
                ) : (
                  sales.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-200">
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
