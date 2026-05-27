"use client";

export const productFlowSteps = [
  {
    title: "Dashboard",
    description: "Acompanhe saldo, margem e integridade em um único painel.",
    href: "/app/dashboard",
  },
  {
    title: "Contas e programas",
    description: "Cadastre a base operacional antes de movimentar pontos.",
    href: "/app/programs",
  },
  {
    title: "Compra",
    description: "Alimente o saldo e o custo médio com a primeira compra.",
    href: "/app/purchases",
  },
  {
    title: "Transferência",
    description: "Realoque pontos entre programas sem perder rastreabilidade.",
    href: "/app/transfers",
  },
  {
    title: "Venda",
    description: "Converta saldo em receita com leitura clara do resultado.",
    href: "/app/sales",
  },
  {
    title: "Configurações",
    description: "Ajuste preferências, usuário e segurança operacional.",
    href: "/app/settings",
  },
] as const;

type ProductFlowProps = {
  title?: string;
  subtitle?: string;
  activeIndex?: number;
  variant?: "page" | "sidebar";
};

export default function ProductFlow({
  title = "Fluxo principal",
  subtitle = "A ordem da operação está visível da base até a configuração final.",
  activeIndex = 0,
  variant = "page",
}: ProductFlowProps) {
  const isSidebar = variant === "sidebar";

  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white/90 shadow-sm ${
        isSidebar ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {activeIndex + 1}/{productFlowSteps.length}
        </div>
      </div>

      <div
        className={`mt-4 grid gap-3 ${
          isSidebar ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {productFlowSteps.map((step, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex;

          return (
            <div
              key={step.title}
              className={`rounded-3xl border p-4 transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-slate-50 text-slate-950"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                  Etapa {index + 1}
                </div>
                <div
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    active
                      ? "bg-white/10 text-white"
                      : done
                        ? "bg-white text-emerald-700"
                        : "bg-white text-slate-500"
                  }`}
                >
                  {active ? "agora" : done ? "concluída" : "próxima"}
                </div>
              </div>
              <div className="mt-3 text-base font-semibold">{step.title}</div>
              <p
                className={`mt-2 text-sm leading-6 ${
                  active
                    ? "text-slate-100"
                    : done
                      ? "text-emerald-900"
                      : "text-slate-600"
                }`}
              >
                {step.description}
              </p>
              <div
                className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  active
                    ? "text-slate-300"
                    : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {step.href.replace("/app/", "")}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
