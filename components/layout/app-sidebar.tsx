"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Archive,
  Briefcase,
  CreditCard,
  Package,
  Settings,
  TrendingUp,
} from "lucide-react";

const operationalLinks = [
  { href: "/app/dashboard", label: "Visão geral", icon: TrendingUp },
  { href: "/app/accounts", label: "Contas", icon: CreditCard },
  { href: "/app/programs", label: "Programas", icon: Briefcase },
  { href: "/app/purchases", label: "Compras", icon: Package },
  { href: "/app/transfers", label: "Transferências", icon: Archive },
  { href: "/app/sales", label: "Vendas", icon: Activity },
];

const supportLinks = [
  { href: "/app/inspection", label: "Inspeção", icon: Settings },
  { href: "/app/settings", label: "Configurações", icon: Settings },
  { href: "/app/onboarding", label: "Onboarding", icon: TrendingUp },
];

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof TrendingUp;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-slate-100 text-slate-950 shadow-card"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          active
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-56 border-r border-slate-100 bg-white/98 backdrop-blur-sm px-4 py-6 flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <div className="text-sm font-bold tracking-tight text-slate-950">
          VisioMilhas
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Sua operação em um só lugar
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <section className="space-y-2">
          <div className="mb-3 px-3 text-label-xs font-semibold text-slate-400">
            Operações
          </div>
          <nav className="space-y-1">
            {operationalLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </section>

        <section className="space-y-2">
          <div className="mb-3 px-3 text-label-xs font-semibold text-slate-400">
            Suporte
          </div>
          <nav className="space-y-1">
            {supportLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </section>
      </div>

      <div className="flex-shrink-0 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 leading-5">
          Gerenciador de milhas eficiente
        </p>
      </div>
    </aside>
  );
}
