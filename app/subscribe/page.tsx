import { headers } from "next/headers";
import { redirect } from "next/navigation";

import TrialBanner from "../../components/layout/trial-banner";
import { resolveControlledSessionContext } from "../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../lib/server/subscription-access";
import {
  evaluateRolloutSanity,
  resolveRolloutAccess,
} from "../../lib/server/rollout-control";
import ActivateTrialButton from "./ActivateTrialButton.client";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#ffffff_42%,_#f8fafc_100%)] px-6 py-16">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
            SaaS access control · controle administrativo
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Assinatura, trial e bloqueio comercial ficam no SAAS_DB.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Esta etapa valida seu acesso comercial antes do dashboard. O app
            operacional continua separado e só é liberado quando o estado SaaS
            permite.
          </p>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-900">
                Estado comercial
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {accessContext.commercialLifecycleState}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-900">
                Estado de acesso
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {accessContext.accessState}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
          {accessContext.accessState === "TRIAL" ? (
            <TrialBanner
              tone="warning"
              title="Trial ativo"
              description="Seu acesso comercial está liberado com aviso de avaliação enquanto o trial estiver válido."
            />
          ) : null}

          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Resumo
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>Tenant:</strong> {accessContext.tenantState}
              </p>
              <p>
                <strong>Assinatura:</strong> {accessContext.subscriptionStatus}
              </p>
              <p>
                <strong>Plano:</strong>{" "}
                {accessContext.planName ??
                  accessContext.planCode ??
                  "sem plano"}
              </p>
              <p>
                <strong>Organização:</strong> {accessContext.organizationId}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isAccessGranted ? (
              <a
                href="/app/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Ir para o dashboard
              </a>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  O acesso comercial ainda não está ativo. Ative o trial para liberar o dashboard.
                </div>
                <ActivateTrialButton disabled={isBlockedAccess} />
                {isBlockedAccess ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    Esta assinatura esta bloqueada e nao permite ativar trial novamente.
                  </div>
                ) : null}
              </div>
            )}

            <div className="text-sm text-slate-500">
              Sem Stripe real nesta etapa. O fluxo apenas controla o acesso e
              mantém a persistência no SAAS_DB.
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
