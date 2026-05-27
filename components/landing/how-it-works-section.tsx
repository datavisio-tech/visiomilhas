import React from "react";

export default function HowItWorksSection() {
  const steps = [
    "Conecte suas contas",
    "Registre compras e vendas",
    "Acompanhe saldo e lucro",
    "Tome decisões melhores",
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Como funciona</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Fluxo simples, execução com aparência premium.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">A estrutura continua enxuta, mas a leitura visual ganha contraste, hierarquia e sensação de produto completo.</p>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Passo {i + 1}</div>
              <div className="mt-3 text-sm font-semibold text-slate-950">{s}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
