import Image from "next/image";
import GoogleSignInCard from "../../components/auth/google-sign-in-card.client";

const previewMetrics = [
  { label: "Saldo líquido", value: "+R$ 12.904" },
  { label: "Rentabilidade", value: "+18,4%" },
  { label: "Alertas leves", value: "3 hoje" },
];

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
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/88 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
            Central operacional para milhas
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl lg:leading-[0.95]">
            Sua central operacional de milhas começa aqui.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
            Controle contas, acompanhe lucro real e centralize toda sua operação em um único painel.
          </p>

          <div className="mt-8 grid max-w-2xl gap-4 rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_120px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:grid-cols-[1.16fr_0.84fr]">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/12 bg-slate-950/90 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.18),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.12),_transparent_34%)]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/50">Painel executivo</div>
                  <div className="mt-1 text-lg font-semibold text-white">Visão rápida do seu inventário</div>
                </div>
                <div className="rounded-full border border-emerald-400/24 bg-emerald-400/12 px-3 py-1 text-xs text-emerald-200">
                  Ao vivo
                </div>
              </div>

              <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <Image
                  src="/assets/mock-dashboard-rich.svg"
                  alt="Prévia do painel VisioMilhas"
                  width={720}
                  height={420}
                  className="h-auto w-full rounded-xl object-cover"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-rows-3">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.35rem] border border-white/12 bg-slate-950/88 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.22)]">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/50">{metric.label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{metric.value}</div>
                </div>
              ))}
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