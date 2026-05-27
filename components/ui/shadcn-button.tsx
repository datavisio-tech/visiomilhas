"use client";

import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  variant?: "default" | "ghost" | "primary" | "outline";
  className?: string;
};

export default function ShadcnButton({ children, href, variant = "default", className = "" }: Props) {
  const base = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400";
  const variants: Record<string, string> = {
    default: "border border-white/12 bg-white/8 text-white shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl hover:bg-white/12",
    outline: "border border-white/14 bg-transparent text-white hover:bg-white/8",
    ghost: "border border-transparent bg-transparent text-white/78 hover:bg-white/8 hover:text-white",
    primary: "border border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_16px_40px_rgba(124,58,237,0.32)] hover:brightness-110",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) return <Link href={href} className={classes}>{children}</Link>;

  return <button className={classes}>{children}</button>;
}
