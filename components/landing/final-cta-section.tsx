import React from "react";
import ShadcnButton from "../ui/shadcn-button";

export default function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.24),_transparent_42%),linear-gradient(180deg,rgba(2,6,23,1),rgba(10,15,30,1))]" />
      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/6 px-6 py-10 shadow-[0_24px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl sm:px-10 sm:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Final call to action</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Comece com uma landing que vende valor antes mesmo do login.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">Uma composição pensada para conversão: clareza, luxo visual e confiança suficiente para parecer uma plataforma madura desde o primeiro contato.</p>
          <div className="mt-8 flex justify-center gap-4">
            <ShadcnButton variant="primary" href="/sign-in?callbackUrl=/app/dashboard" className="px-6 py-3 text-base shadow-[0_0_32px_rgba(124,58,237,0.42)]">Começar grátis</ShadcnButton>
          </div>
        </div>
      </div>
    </section>
  );
}
