import Image from "next/image";
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.38),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_42%,_#07111f_100%)]" />
      <div className="absolute left-[-80px] top-[-90px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute right-[-80px] top-24 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-10 lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
        <section className="order-2 flex flex-col justify-center lg:order-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.55)]" />
            Acesso premium para milhas
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            Toda sua operação de milhas em um único painel inteligente.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
            Centralize contas, acompanhe lucro real e tome decisões com mais
            segurança operacional.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-[0_32px_120px_rgba(2,6,23,0.32)] backdrop-blur-2xl sm:p-6">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-4 sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_34%)]" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/50">
                      Painel executivo
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      Indicadores essenciais
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Ao vivo
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 p-2">
                  <Image
                    src="/assets/mock-dashboard-rich.svg"
                    alt="Prévia compacta do painel VisioMilhas"
                    width={720}
                    height={420}
                    className="h-auto w-full rounded-xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
          <GoogleSignInCard callbackUrl={callbackUrl} />
        </section>
      </div>
    </main>
  );
}
