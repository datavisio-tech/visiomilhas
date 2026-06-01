import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrimaryButton from "../../../components/ui/button";
import PageHeader from "../../../components/ui/page-header";
import { getOnboardingStateByEmail } from "../../../lib/server/onboarding";
import OnboardingFormClient from "./OnboardingForm.client";

export default async function OnboardingPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "onboarding.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/onboarding");
  }

  const email = sessionContext.auth.email ?? null;
  const onboardingState = await getOnboardingStateByEmail(email);
  const currentStep = onboardingState === "ready" ? 4 : 1;

  const steps = [
    {
      id: 1,
      title: "Criar conta operacional",
      description:
        "Abra Contas, escolha o programa certo e defina o apelido da operação para começar com a base limpa.",
      href: "/app/accounts",
    },
    {
      id: 2,
      title: "Registrar saldo inicial",
      description:
        "Se já houver pontos, lance o saldo inicial para refletir a posição real da conta.",
      href: "/app/accounts",
    },
    {
      id: 3,
      title: "Lançar compras e pontos",
      description:
        "Use compras bonificadas ou aquisição de pontos para alimentar a operação com origem rastreável.",
      href: "/app/purchases",
    },
    {
      id: 4,
      title: "Acompanhar o cockpit",
      description:
        "Depois da primeira conta, revise movimentos, saldo e resultado operacional no cockpit.",
      href: "/app/programs",
    },
  ];

  if (onboardingState === "ready") {
    redirect("/subscribe");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Primeira configuração"
        title="Onboarding operacional guiado"
        subtitle="Comece pela conta operacional: nela vivem saldo, CPM, compras e o histórico que sustenta a operação."
        actions={
          <PrimaryButton href="/app/accounts">Ir para contas</PrimaryButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Passo a passo
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            O produto começa simples e vai ganhando contexto
          </h2>
          <div className="mt-4 space-y-3">
            {steps.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block rounded-3xl border p-4 transition ${
                  item.id === currentStep
                    ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                    : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {item.id}. {item.title}
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      item.id === currentStep
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {item.id < currentStep
                      ? "concluído"
                      : item.id === currentStep
                        ? "em andamento"
                        : "próximo"}
                  </div>
                </div>
                <div
                  className={`mt-2 text-sm leading-6 ${
                    item.id === currentStep
                      ? "text-slate-100"
                      : "text-slate-600"
                  }`}
                >
                  {item.description}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Estado atual
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {onboardingState === "not-started"
                ? "Você ainda não começou"
                : "Falta criar a primeira conta"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {onboardingState === "not-started"
                ? "Abra Contas e siga o passo a passo para estruturar a primeira base operacional."
                : "A organização já existe. Agora crie a conta operacional e lance o saldo inicial para começar a operar."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Como começar
            </div>
            <div className="mt-3 text-base font-semibold text-slate-950">
              Abra Contas para criar sua primeira base operacional
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. Clique em Nova conta.</li>
              <li>2. Escolha um programa e dê um apelido claro para a conta.</li>
              <li>3. Se já houver saldo, registre-o antes de seguir para compras.</li>
            </ol>
            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton href="/app/accounts">Abrir contas</PrimaryButton>
            </div>
          </div>

          <OnboardingFormClient
            onboardingState={onboardingState}
            flowStage={onboardingState === "partial" ? "recovery" : "start"}
          />
        </section>
      </div>
    </div>
  );
}

