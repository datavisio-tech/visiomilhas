import dynamic from "next/dynamic";

const TrialCountdown = dynamic(() => import("./trial-countdown.client"), {
  ssr: false,
});

type TrialBannerProps = {
  tone?: "info" | "warning";
  title?: string;
  description?: string;
  variant?: "trial" | "subscription";
  trialEndsAt?: string | null;
};

export default function TrialBanner({
  tone = "warning",
  variant = "subscription",
  title,
  description,
  trialEndsAt,
}: TrialBannerProps) {
  const styles =
    variant === "subscription"
      ? "bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 border-emerald-200"
      : tone === "warning"
        ? "bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200"
        : "bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200";
  const titleStyles =
    variant === "subscription"
      ? "text-slate-950"
      : tone === "warning"
        ? "text-amber-900"
        : "text-blue-900";
  const badgeStyles =
    variant === "subscription"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-blue-100 text-blue-700";
  const content =
    variant === "trial"
      ? {
          title: title ?? "Período de avaliação ativo",
          description:
            description ??
            "Explore todos os recursos enquanto seu trial estiver válido.",
          badge: "Trial ativo",
        }
      : {
          title: title ?? "Ative sua assinatura mensal",
          description:
            description ??
            "Por R$ 4,99/mês, você libera o dashboard e mantém a operação em ordem.",
          badge: "R$ 4,99/mês",
        };

  if (variant === "trial") {
    // Premium conversion-focused trial banner
    return (
      <div className={`${styles} border rounded-card bg-white p-6 shadow-card`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Acesso premium para testes
              </div>
            </div>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Sua operação premium está liberada.
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Acompanhe saldo, margem e movimentações sem limitações.
            </p>
          </div>

          <div className="mt-4 flex w-full items-center justify-between gap-4 sm:mt-6 lg:mt-0 lg:w-auto">
            <div className="text-right">
              {/* Countdown client renders remaining time until trial expiration and warning about read-only after expiry */}
              {trialEndsAt ? (
                <div className="mt-3">
                  {/* Mount client countdown component */}
                  <div>
                    <TrialCountdown
                      trialEndsAt={trialEndsAt}
                      items-center
                      justify-between
                    />
                  </div>
                  <p className="mt-2 text-sm text-rose-700">
                    * Após fim do período de testes, seu acesso será somente
                    leitura.
                  </p>
                </div>
              ) : null}
            </div>

            <a
              href="/subscribe"
              className="inline-flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              Ativar plano por R$ 4,99/mês
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles} border rounded-card p-card-p-lg shadow-card`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <strong
            className={`${titleStyles} block text-base font-semibold sm:text-lg`}
          >
            {content.title}
          </strong>
          <p className="text-sm leading-6 text-slate-600">
            {content.description}
          </p>
          {variant === "subscription" ? (
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">
                Sem plano complexo
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">
                Liberação imediata
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">
                R$ 4,99 por mês
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:text-right">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Mensalidade
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {content.badge}
            </div>
          </div>
          <div
            className={`${badgeStyles} rounded-full px-4 py-2 text-xs font-semibold text-nowrap flex-shrink-0`}
          >
            {variant === "subscription" ? "Assine agora" : content.badge}
          </div>
        </div>
      </div>
    </div>
  );
}
