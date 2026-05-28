"use client";

import type { ButtonHTMLAttributes } from "react";

type SwitchProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
};

export default function Switch({
  checked = false,
  className = "",
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        checked
          ? "border-emerald-500 bg-emerald-500"
          : "border-slate-300 bg-slate-200"
      } ${className}`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
