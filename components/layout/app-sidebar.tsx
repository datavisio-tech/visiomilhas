"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProductFlow, { productFlowSteps } from "../ui/product-flow";

const operationalLinks = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/accounts", label: "Contas" },
  { href: "/app/programs", label: "Programas" },
  { href: "/app/purchases", label: "Compras" },
  { href: "/app/transfers", label: "Transferências" },
  { href: "/app/sales", label: "Vendas" },
];

const setupLinks = [
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/settings", label: "Configurações" },
  { href: "/app/inspection", label: "Inspeção" },
  { href: "/app/entries", label: "Lançamentos" },
  { href: "/app/clubs", label: "Clubes" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-sm"
          : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span>{label}</span>
      {active ? <span className="text-[10px] uppercase tracking-[0.18em]">Ativo</span> : null}
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const activeIndex = productFlowSteps.findIndex((step) => step.href === pathname);

  return (
    <aside className="fixed h-screen w-[19rem] border-r border-slate-200 bg-white/92 px-4 py-4 backdrop-blur-xl">
      <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-[0_22px_50px_rgba(15,23,42,0.28)]">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          VisioMilhas
        </div>
        <div className="mt-3 text-xl font-semibold leading-tight">
          Fluxo claro para operar milhas com menos ruído.
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Um produto orientado por jornada: base, compra, transferência, venda e configuração.
        </p>
      </div>

      <div className="mt-4">
        <ProductFlow
          variant="sidebar"
          title="Jornada do produto"
          subtitle="A barra lateral mostra a ordem recomendada para configurar e operar o SaaS."
          activeIndex={activeIndex < 0 ? 0 : activeIndex}
        />
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <section>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Operação
          </div>
          <nav className="space-y-1">
            {operationalLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <section>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Configuração
          </div>
          <nav className="space-y-1">
            {setupLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Fluxo assistido
          </div>
          <div className="mt-2 text-sm leading-6">
            Dashboard, onboarding e telas operacionais ficam alinhados ao mesmo caminho visual.
          </div>
        </div>
      </div>
    </aside>
  );
}
