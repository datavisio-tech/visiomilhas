"use client";

import Link from "next/link";
import React from "react";
import PrimaryButton from "./button";

export default function MarketingHero() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              O jeito inteligente de cuidar das suas milhas
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Descubra como custo por milha automática, simulações de cenários e um assistente IA que conhece seus programas de verdade.
            </p>

            <div className="mt-8 flex gap-3">
              <PrimaryButton className="shadow-lg">
                <Link href="/app/onboarding">Começar grátis</Link>
              </PrimaryButton>
              <Link href="/app/dashboard" className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50">Ver demo</Link>
            </div>

            <ul className="mt-8 grid gap-2 text-sm text-slate-600">
              <li>• Preços transparentes e simulações reais</li>
              <li>• Controle de CPF e histórico consolidado</li>
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-md">
              <img src="/assets/marketing-hero-mock.png" alt="Mockup" className="w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
