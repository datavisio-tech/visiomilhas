import GoogleSignInCard from "../../components/auth/google-sign-in-card.client";

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = searchParams?.callbackUrl?.trim() || "/app/dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-10 lg:grid lg:grid-cols-[58%_42%] lg:items-stretch lg:gap-0">
        <section className="order-2 flex flex-col justify-center lg:order-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.55)]" />
            Controle premium para milhas
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            Controle suas milhas como um operador profissional.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
            Centralize contas, acompanhe lucro real e tome decisões com mais
            segurança operacional.
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-[15px]">
            Organize suas contas, compras, transferências e vendas com visão
            consolidada.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-[0_32px_120px_rgba(2,6,23,0.34)] backdrop-blur-2xl transition duration-200 hover:border-cyan-300/20 hover:shadow-[0_36px_130px_rgba(2,6,23,0.42)] sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Preview operacional
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Mini preview operacional
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    Painel de acompanhamento
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition duration-200 hover:border-slate-300 hover:bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Saldo consolidado
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                    2.382.221 pts
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition duration-200 hover:border-slate-300 hover:bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    CPM médio
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                    R$ 24,94
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition duration-200 hover:border-slate-300 hover:bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Resultado operacional
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                    - R$ 1.240
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] px-0 py-8 lg:order-2 lg:h-full lg:self-stretch lg:border-l lg:border-slate-200 lg:px-14 lg:py-0 lg:justify-center">
          <GoogleSignInCard callbackUrl={callbackUrl} />
        </section>
      </div>
    </main>
  );
}
