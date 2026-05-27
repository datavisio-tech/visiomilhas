import React from "react";

function MockCard({ title, image }: { title: string; image: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <img src={image} alt={title} className="w-full rounded-md" />
    </div>
  );
}

export default function MockupsSection() {
  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">Previews</h2>
        <p className="mt-2 text-slate-600">Visualizações rápidas do produto.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <MockCard title="Dashboard" image="/assets/mock-dashboard.svg" />
          <MockCard
            title="Gestão de contas"
            image="/assets/mock-accounts.svg"
          />
          <MockCard
            title="Simulação operacional"
            image="/assets/mock-sim.svg"
          />
        </div>
      </div>
    </section>
  );
}
