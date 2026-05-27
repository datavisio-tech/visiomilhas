"use client";

import Link from "next/link";
import React from "react";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  href?: string;
};

export function PrimaryButton({ children, className = "", ariaLabel, href }: BaseProps) {
  const base = "inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={`${base} ${className}`} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ariaLabel, href }: BaseProps) {
  const base = "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={`${base} ${className}`} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export default PrimaryButton;
