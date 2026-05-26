export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import { getPurchasesOverview } from "../../../lib/data/purchases";
import { getAccountsOverview } from "../../../lib/data/accounts";
import PurchaseForm from "../../../components/forms/purchase-form";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";

export default async function PurchasesPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "purchases.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/purchases");
  const purchases = await getPurchasesOverview(sessionContext);
  const accounts = await getAccountsOverview(sessionContext);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operação"
        title="Compras"
        subtitle="Registre aquisições de pontos com leitura clara do impacto no saldo e no custo médio."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-1">
          <PurchaseForm accounts={accounts} />
        </div>
        <div className="col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {purchases.length === 0 ? (
              <EmptyState
                title="Nenhuma compra registrada"
                description="Registre a primeira compra para alimentar o saldo operacional e o custo médio do milheiro."
                actionLabel="Ir para onboarding"
                actionHref="/app/onboarding"
                supportingText="primeiro lançamento"
              />
            ) : (
              purchases.map((p: any) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{p.status}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {p.program ?? p.account ?? `Compra #${p.id}`}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {p.points.toLocaleString()} pts
                  </div>
                  <div className="text-sm text-slate-600">
                    {p.description ?? "Compra operacional registrada com sucesso."}
                  </div>
                  <div className="mt-3 text-sm font-medium text-slate-950">
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
