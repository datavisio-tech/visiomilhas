import PageHeader from "../../../components/ui/page-header";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TransimulatorPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "transimulator.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/transimulator");
  }

  return (
    <div>
      <PageHeader
        title="Simuladores"
        subtitle="Tela em desenvolvimento para cenários operacionais."
      />
      <div className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        O módulo de simuladores está em construção. A rota existe para evitar
        404 no fluxo operacional.
      </div>
    </div>
  );
}
