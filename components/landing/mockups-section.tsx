import Image from "next/image";
import React from "react";

function MockCard({ title, image, tone }: { title: string; image: string; tone: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.38)] backdrop-blur-2xl transition hover:-translate-y-1">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200">LIVE</div>
      </div>
      <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/90 p-3">
        <Image src={image} alt={title} width={900} height={540} className="h-auto w-full rounded-[1rem] object-cover" />
      </div>
      <div className="mt-3 grid gap-2 text-[11px] text-white/62 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">alerta: 2 pontos</div>
        <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">status: estável</div>
        <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">última sync: agora</div>
      </div>
    </div>
  );
}

export default function MockupsSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.14),_transparent_45%)]" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Painéis interativos</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Os painéis parecem screenshots de um produto que já está operando.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/68">Métricas, tabelas, alertas, chips e pequenos estados dão densidade sem poluir a leitura. A tela passa a sensação de software vivo.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="lg:-mt-8">
            <MockCard title="Dashboard executivo" image="/assets/mock-dashboard-rich.svg" tone="from-violet-400 via-fuchsia-400 to-cyan-300" />
          </div>

          <div className="grid gap-6">
            <MockCard title="Gestão de contas" image="/assets/mock-accounts-rich.svg" tone="from-cyan-300 via-sky-400 to-violet-400" />
            <MockCard title="Simulação operacional" image="/assets/mock-sim-rich.svg" tone="from-fuchsia-400 via-violet-400 to-cyan-300" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            "KPI cards",
            "Tags de status",
            "Mini charts",
            "Tabelas vivas",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72 backdrop-blur-xl">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
