import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrimaryButton from "../../../components/ui/button";
import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
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
  const currentStep = onboardingState === "not-started" ? 1 : 2;

  const steps = [
    {
      id: 1,
      title: "Criar conta/programa",
      description:
        "Estruture a base operacional com um programa e uma conta padrão para começar a operar.",
      href: "/app/programs",
    },
    {
      id: 2,
      title: "Registrar primeira compra",
      description:
        "Alimente o saldo operacional com a primeira compra para ativar o fluxo do produto.",
      href: "/app/purchases",
    },
    {
      id: 3,
      title: "Conferir contas",
      description:
        "Revise a base criada antes de seguir para a operação principal.",
      href: "/app/accounts",
    },
    {
      id: 4,
      title: "Executar primeira venda",
      description:
        "Feche o ciclo inicial e confirme que o MVP já está pronto para uso real.",
      href: "/app/sales",
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
        subtitle="Siga um fluxo curto e claro para deixar o SaaS pronto para uso: criar base, registrar compra, validar saldo e operar a primeira venda."
        actions={<PrimaryButton href="/app/dashboard">Ir para dashboard</PrimaryButton>}
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
                    {item.id < currentStep ? "concluído" : item.id === currentStep ? "em andamento" : "próximo"}
                  </div>
                </div>
                <div
                  className={`mt-2 text-sm leading-6 ${
                    item.id === currentStep ? "text-slate-100" : "text-slate-600"
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
                : "Base operacional parcial"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {onboardingState === "not-started"
                ? "Criar a primeira conta/programa é o próximo passo para liberar o dashboard e registrar a primeira compra."
                : "A estrutura existe parcialmente. Recupere o que falta e valide o saldo antes de seguir para vendas."}
            </p>
          </div>

          <EmptyState
            title={
              onboardingState === "not-started"
                ? "Crie a base operacional"
                : "Recupere a base operacional"
            }
            description={
              onboardingState === "not-started"
                ? "O fluxo abaixo orienta a criação da primeira conta e do primeiro programa para sair do modo de preparação e começar a operar."
                : "A estrutura existe parcialmente. Confirme a conta, revise a base e siga para a primeira compra com segurança."
            }
            actionLabel={
              onboardingState === "not-started"
                ? "Abrir programas"
                : "Abrir contas"
            }
            actionHref={
              onboardingState === "not-started"
                ? "/app/programs"
                : "/app/accounts"
            }
            supportingText="fluxo guiado"
          />

          <OnboardingFormClient
            onboardingState={onboardingState}
            flowStage={onboardingState === "partial" ? "recovery" : "start"}
          />
        </section>
      </div>
    </div>
  );
}
