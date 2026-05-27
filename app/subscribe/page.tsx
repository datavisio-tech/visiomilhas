import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveControlledSessionContext } from "../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../lib/server/subscription-access";
import {
  evaluateRolloutSanity,
  resolveRolloutAccess,
} from "../../lib/server/rollout-control";
import ActivateTrialButton from "./ActivateTrialButton.client";
import TrialBanner from "../../components/layout/trial-banner";

export default async function SubscribePage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "subscribe.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/subscribe");
  }

  const requestHeaders = await headers();
  const rolloutAccess = await resolveRolloutAccess(sessionContext, {
    source: "subscribe.page",
    requestHeaders,
  });

  if (!rolloutAccess.allowed) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#ffffff_42%,_#f8fafc_100%)] px-6 py-16">
        <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
            Rollout control ativo
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Acesso restrito ao grupo piloto.
          </h1>
          <p className="text-sm leading-7 text-slate-600">
            Este ambiente está preparado para rollout controlado. Seu usuário
            ainda não está liberado no grupo piloto operacional.
          </p>
        </section>
      </main>
    );
  }

  const accessContext = await resolveSubscriptionAccessContext(sessionContext, {
    source: "subscribe.page",
    requestHeaders,
  });

  if (!accessContext) {
    redirect("/sign-in?callbackUrl=/subscribe");
  }

  await evaluateRolloutSanity({
    sessionContext,
    accessContext,
    source: "subscribe.page",
    requestHeaders,
  });

  const isAccessGranted =
    accessContext.accessState === "ACTIVE" ||
    accessContext.accessState === "TRIAL";
  const isBlockedAccess =
    accessContext.accessState === "CANCELED" ||
    accessContext.accessState === "SUSPENDED";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#ffffff_42%,_#f8fafc_100%)] px-6 py-12 lg:py-14">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-6 text-center">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Continue operando com clareza todos os dias.
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Mantenha saldo, custo e movimentações centralizados por apenas
              <span className="ml-2 font-semibold text-slate-900">
                R$ 4,99/mês
              </span>
              .
            </p>
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-500">
                  Por apenas
                </div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  R$ 4,99
                  <span className="text-sm font-medium text-slate-600">
                    /mês
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ActivateTrialButton disabled={false} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium ring-1 ring-slate-100">
              Controle operacional centralizado
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium ring-1 ring-slate-100">
              Histórico e movimentações organizadas
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium ring-1 ring-slate-100">
              Continuidade operacional
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium ring-1 ring-slate-100">
              Operação sem limitações
            </span>
          </div>

          {/* estado comercial removido por request - centralizando hero abaixo */}
        </div>

        <div className="mx-auto max-w-3xl">
          <TrialBanner variant="subscription" />

          <div className="mt-6 flex justify-center">
            {isAccessGranted ? (
              <a
                href="/app/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Ir para o dashboard
              </a>
            ) : (
              <ActivateTrialButton disabled={false} />
            )}
          </div>

          {isBlockedAccess ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Esta assinatura está bloqueada e não permite liberar o acesso
              novamente.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
