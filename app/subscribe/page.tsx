import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { resolveControlledSessionContext } from "../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../lib/server/subscription-access";
import {
  evaluateRolloutSanity,
  resolveRolloutAccess,
} from "../../lib/server/rollout-control";
import ActivateTrialButton from "./ActivateTrialButton.client";

function resolvePlanLabel(value: string | undefined, fallback: string) {
  const label = value?.trim();

  return label && label.length > 0 ? label : fallback;
}

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

  const isBlockedAccess =
    accessContext.accessState === "CANCELED" ||
    accessContext.accessState === "SUSPENDED";
  const monthlyPlanLabel = resolvePlanLabel(
    process.env.PLANO,
    "preço mensal configurado",
  );
  const annualPlanLabel = resolvePlanLabel(
    process.env.PLANO_ANUAL,
    "preço anual configurado",
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.95)_0%,_rgba(255,255,255,0.92)_34%,_rgba(248,250,252,1)_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Teste grátis de 15 dias
              </div>

              <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:mx-0 lg:max-w-3xl lg:text-5xl">
                Comece grátis por 15 dias
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
                Organize sua operação de milhas com visão financeira: acompanhe
                contas, programas, compras bonificadas, aquisição de milhas,
                movimentos e saldos em um painel feito para decidir com clareza.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-3"></div>

              <div className="mt-5">
                <ActivateTrialButton disabled={isBlockedAccess} />
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  Sem cartão de crédito
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  Ferramenta Premium com acesso completo
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  Sem cobrança imediata
                </span>
                <br></br>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  Valide o lucro da operação antes necogiar
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  Seus dados permanecem acessíveis
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:gap-6">
          <section className="order-2 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-8 lg:order-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Compare os planos
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Comece sem compromisso e mantenha a operação completa quando o
                  VisioMilhas virar parte da sua rotina financeira.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Trial Gratuito
                  </div>
                  <Clock3
                    className="h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  15 dias
                </div>
                <p className="mt-2 text-sm text-emerald-800">
                  Para conhecer a operação completa antes de decidir.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    Acesso completo durante o teste
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    Sem cobrança no período
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    Sem cartão obrigatório agora
                  </li>
                </ul>
              </article>

              <article className="rounded-2xl border border-sky-200/80 bg-sky-50 p-5 shadow-sm ring-1 ring-sky-100 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">
                    Plano Mensal
                  </div>
                  <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    Mais popular
                  </div>
                  <BadgeCheck
                    className="h-5 w-5 text-sky-700"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {monthlyPlanLabel}
                </div>
                <p className="mt-2 text-sm text-sky-800">
                  Para manter edição, acompanhamento e rotina operacional
                  ativos.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
                      aria-hidden="true"
                    />
                    Acesso completo após o trial
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
                      aria-hidden="true"
                    />
                    Cancelamento livre
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
                      aria-hidden="true"
                    />
                    Indicado para operação mensal
                  </li>
                </ul>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Plano Anual
                  </div>
                  <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Melhor economia
                  </div>
                  <CalendarDays
                    className="h-5 w-5 text-slate-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {annualPlanLabel}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Para quem acompanha milhas com frequência e prefere
                  previsibilidade.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Acesso completo por 12 meses
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Economia anual
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Mais previsibilidade para a rotina
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <section className="order-1 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-8 lg:order-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  O que você desbloqueia
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  A proposta é simples: deixar a operação financeira das milhas
                  mais clara, com controle diário e leitura rápida do que
                  importa.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
              <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5">
                <LayoutGrid
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-sm font-semibold text-slate-950 sm:text-base">
                  Contas Operacionais
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Centralize cada conta e enxergue a operação sem ruído.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5">
                <BadgeCheck
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-sm font-semibold text-slate-950 sm:text-base">
                  Compras Bonificadas
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Acompanhe o ciclo da compra até a entrada dos pontos.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5">
                <WalletCards
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-sm font-semibold text-slate-950 sm:text-base">
                  Controle de Saldos
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Veja saldo disponível, histórico e posição operacional.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5">
                <TrendingUp
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-sm font-semibold text-slate-950 sm:text-base">
                  Resultado Operacional
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Entenda o resultado da operação com leitura rápida.
                </p>
              </article>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Como funciona o acesso
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Se o teste terminar e não houver assinatura ativa, seus dados não
              são perdidos. Você continua consultando suas informações em modo
              somente leitura; apenas as permissões de alteração ficam
              indisponíveis até a assinatura ser ativada.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 shadow-sm">
              <div className="text-sm font-semibold text-emerald-950">
                Trial
              </div>
              <p className="mt-2 text-sm text-emerald-800">
                15 dias de acesso completo.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-4 shadow-sm">
              <div className="text-sm font-semibold text-sky-950">
                Assinante
              </div>
              <p className="mt-2 text-sm text-sky-800">
                Acesso completo para operar.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
              <div className="text-sm font-semibold text-amber-950">
                Sem assinatura
              </div>
              <p className="mt-2 text-sm text-amber-800">
                Modo somente leitura.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
