import React from "react";
import ShadcnButton from "../ui/shadcn-button";

export default function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.24),_transparent_42%),linear-gradient(180deg,rgba(2,6,23,1),rgba(10,15,30,1))]" />
      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/6 px-6 py-10 shadow-[0_24px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl sm:px-10 sm:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Pronto para operar</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Troque planilhas soltas por uma central que deixa sua operação mais clara e lucrativa.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">Entre com mais controle, menos ruído e uma visão que ajuda a decidir com tranquilidade. É a última virada antes de transformar dados em ação.</p>
          <div className="mt-8 flex justify-center gap-4">
            <ShadcnButton variant="primary" href="/sign-in?callbackUrl=/app/dashboard" className="px-6 py-3 text-base shadow-[0_0_32px_rgba(124,58,237,0.42)]">Quero minha central de milhas</ShadcnButton>
          </div>
        </div>
      </div>
    </section>
  );
}
