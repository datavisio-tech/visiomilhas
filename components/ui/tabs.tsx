"use client";

import type { ReactNode } from "react";

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function TabsTrigger({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-card"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

export function TabsPanel({ children }: { children: ReactNode }) {
  return <div className="mt-6">{children}</div>;
}
