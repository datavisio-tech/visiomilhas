"use client";

import type { SelectHTMLAttributes } from "react";

export default function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}
