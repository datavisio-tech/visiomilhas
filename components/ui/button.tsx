"use client";

import Link from "next/link";
import React from "react";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({
  children,
  className = "",
  ariaLabel,
  href,
  ...props
}: BaseProps) {
  const base =
    "inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-card active:scale-95";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} ${className}`}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ariaLabel,
  href,
  ...props
}: BaseProps) {
  const base =
    "inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 hover:shadow-card active:scale-95";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} ${className}`}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;
