"use client";

import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  variant?: "default" | "ghost" | "primary";
  className?: string;
};

export default function ShadcnButton({ children, href, variant = "default", className = "" }: Props) {
  const base = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    default: "bg-white border border-slate-200 text-slate-900 shadow-sm",
    ghost: "bg-transparent text-slate-700",
    primary: "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) return <Link href={href} className={classes}>{children}</Link>;

  return <button className={classes}>{children}</button>;
}
