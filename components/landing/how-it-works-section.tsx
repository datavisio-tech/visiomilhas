import React from "react";

export default function HowItWorksSection() {
  const steps = [
    "Traga contas e programas para um único painel",
    "Registre compras, vendas e transferências",
    "Veja custo, lucro e alerta em um só lugar",
    "Aja com mais controle e tranquilidade",
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Storytelling</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Do caos operacional à decisão limpa em poucos passos.</h2>
          <p className="mt-4 text-base leading-7 text-slate-700">Você entra com contas dispersas, centraliza a operação e termina com mais clareza sobre o que vender, transferir e manter.</p>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Etapa {i + 1}</div>
              <div className="mt-3 text-sm font-semibold text-slate-950">{s}</div>
              <div className="mt-3 h-px bg-gradient-to-r from-violet-200 via-slate-200 to-transparent" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
