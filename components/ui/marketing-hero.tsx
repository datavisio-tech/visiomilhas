"use client";

import React from "react";
import ShadcnButton from "./shadcn-button";

const heroBadges = ["Premium SaaS", "IA operacional", "Simulação e controle"];

export default function MarketingHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.42),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.24),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#07111f_100%)]" />
      <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-60px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
            VisioMilhas premium workspace
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {heroBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75 backdrop-blur-md">
                {badge}
              </span>
            ))}
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl lg:leading-[0.95]">
            Operação de milhas com aparência de produto financiado e execução de time sênior.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
            Uma homepage com presença de startup madura: dashboards falsos que parecem reais, métricas com profundidade, simulações elegantes e uma narrativa visual que transmite confiança imediata.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ShadcnButton variant="primary" href="/app/onboarding" className="px-6 py-3 text-base shadow-[0_0_32px_rgba(124,58,237,0.45)]">
              Começar agora
            </ShadcnButton>
            <ShadcnButton variant="default" href="/app/dashboard" className="border-white/15 bg-white/8 px-6 py-3 text-base text-white hover:bg-white/12">
              Ver experiência
            </ShadcnButton>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-white/68 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
              <div className="text-white">R$ 0,00</div>
              <div className="mt-1 text-white/60">Setup inicial sem atrito</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
              <div className="text-white">16 cenários</div>
              <div className="mt-1 text-white/60">Simulação visual pronta</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
              <div className="text-white">+7 programas</div>
              <div className="mt-1 text-white/60">Controle centralizado</div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="absolute left-8 top-8 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute right-0 top-28 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative w-full max-w-[620px] rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_120px_rgba(2,6,23,0.6)] backdrop-blur-2xl lg:-mr-10">
            <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/90 p-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Live cockpit</div>
                  <div className="mt-1 text-lg font-semibold text-white">VisioMilhas Overview</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  Atualizado agora
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/60">Rentabilidade acumulada</div>
                      <div className="mt-1 text-2xl font-semibold text-white">R$ 28.430,00</div>
                    </div>
                    <div className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">+18,4%</div>
                  </div>

                  <div className="mt-5 h-48 rounded-2xl bg-[linear-gradient(180deg,rgba(124,58,237,0.18),rgba(14,165,233,0.06))] p-4">
                    <div className="flex h-full items-end gap-3">
                      {[42, 58, 49, 72, 64, 88, 77, 96].map((height, index) => (
                        <div key={index} className="flex-1">
                          <div className="rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-300 shadow-[0_0_20px_rgba(124,58,237,0.45)]" style={{ height: `${height}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Distribuição</div>
                    <div className="mt-3 space-y-3">
                      {[
                        ["Livelo", "42%"],
                        ["Smiles", "31%"],
                        ["TudoAzul", "18%"],
                      ].map(([label, value]) => (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm text-white/70">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-500" style={{ width: value }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Operação</div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-white">24 compras</div>
                        <div className="mt-1 text-white/55">Hoje</div>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-white">8 vendas</div>
                        <div className="mt-1 text-white/55">Margem em alta</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Saldo líquido", "+R$ 12.904"],
                  ["Transferências", "98,6% aprovadas"],
                  ["Alertas", "2 pontos em revisão"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/42">{label}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
