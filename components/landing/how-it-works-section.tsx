import React from "react";

export default function HowItWorksSection() {
  const steps = [
    "Conecte suas contas",
    "Registre compras e vendas",
    "Acompanhe saldo e lucro",
    "Tome decisões melhores",
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">Como funciona</h2>
        <p className="mt-2 text-slate-600">Fluxo simples para começar a operar em minutos.</p>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="rounded-2xl border p-6 bg-white shadow-sm">
              <div className="text-sm font-semibold text-slate-900">{i + 1}. {s}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
