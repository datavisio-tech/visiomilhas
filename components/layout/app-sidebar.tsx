"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const operationalLinks = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/purchases", label: "Compras" },
  { href: "/app/sales", label: "Vendas" },
  { href: "/app/transfers", label: "Transferências" },
  { href: "/app/inspection", label: "Inspeção" },
];

const setupLinks = [
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/programs", label: "Programas" },
  { href: "/app/accounts", label: "Contas" },
  { href: "/app/entries", label: "Lançamentos" },
  { href: "/app/settings", label: "Configurações" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span>{label}</span>
      {active ? <span className="text-[10px] uppercase tracking-[0.18em]">Ativo</span> : null}
    </Link>
  );
}

export default function AppSidebar() {
  return (
    <aside className="fixed h-screen w-72 border-r border-slate-200 bg-white/90 px-4 py-5 backdrop-blur">
      <div className="mb-6 rounded-3xl bg-slate-950 px-4 py-4 text-white shadow-lg">
        <div className="text-lg font-semibold">VisioMilhas</div>
        <div className="mt-1 text-sm text-slate-300">
          MVP operacional para gestão de milhas
        </div>
      </div>

      <div className="space-y-6 text-sm">
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
            Setup
          </div>
          <nav className="space-y-1">
            {setupLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Confiança operacional
          </div>
          <div className="mt-2 text-sm leading-6">
            Dashboard, inspeção e recovery continuam acessíveis com linguagem de produto.
          </div>
        </div>
      </div>
    </aside>
  );
}
