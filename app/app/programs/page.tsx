export const dynamic = "force-dynamic";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import { getProgramsOverview } from "../../../lib/data/programs";

export default async function ProgramsPage() {
  const programs = await getProgramsOverview();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Setup"
        title="Programas"
        subtitle="Gerencie seus programas de fidelidade e mantenha a estrutura pronta para compras, vendas e transferências."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {programs.length === 0 ? (
          <div className="md:col-span-3">
            <EmptyState
              title="Nenhum programa encontrado"
              description="Crie o primeiro programa para ligar a conta operacional ao ecossistema de milhas e liberar o fluxo de compras."
              actionLabel="Ir para onboarding"
              actionHref="/app/onboarding"
              supportingText="base do produto"
            />
          </div>
        ) : (
          programs.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-950">{p.name}</div>
              <div className="text-sm text-slate-600">{p.type}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
