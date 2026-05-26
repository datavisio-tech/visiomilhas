"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const analysisLinks = [
  { href: "/app/dashboard", label: "Painel" },
  { href: "/app/accounts", label: "Contas" },
  { href: "/app/programs", label: "Programas" },
];

const earnLinks = [
  { href: "/app/purchases", label: "Compras" },
  { href: "/app/sales", label: "Vendas" },
  { href: "/app/transfers", label: "Transferências" },
];

const toolsLinks = [
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/settings", label: "Configurações" },
  { href: "/app/inspection", label: "Inspeção avançada" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
          : "text-slate-600 hover:bg-white hover:text-slate-950"
      }`}
    >
      <span>{label}</span>
    </Link>
  );
}

export default function AppSidebar() {
  return (
    <aside className="fixed h-screen w-72 border-r border-slate-200 bg-[#f4f4f5] px-4 py-5">
      <div className="mb-6 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
        <div className="text-lg font-semibold text-slate-950">MeuMilheiro</div>
        <div className="mt-1 text-sm text-slate-500">
          Gestão simples de milhas e pontos
        </div>
      </div>

      <div className="space-y-5 text-sm">
        <section>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Operação
          </div>
          <nav className="space-y-1">
            {analysisLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <section>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Ganhe pontos
          </div>
          <nav className="space-y-1">
            {earnLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <section>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Ferramentas
          </div>
          <nav className="space-y-1">
            {toolsLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </section>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-slate-600 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Programas ativos
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Clube Livelo Helena
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Latam Pass Jucivan
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Livelo Jucivan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
