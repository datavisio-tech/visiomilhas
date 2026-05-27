import React from "react";
import Image from "next/image";
import ShadcnButton from "./shadcn-button";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  body: React.ReactNode;
  imageSrc?: string;
  reverse?: boolean;
  cta?: { href: string; label: string } | null;
};

export default function MarketingSection({ eyebrow, title, body, imageSrc, reverse = false, cta }: Props) {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(7,15,31,0.94))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className={reverse ? "lg:order-2" : ""}>
          {eyebrow ? (
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">{eyebrow}</div>
          ) : null}
          <div className="max-w-xl rounded-[1.5rem] border border-white/8 bg-slate-900/78 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.32)] ring-1 ring-white/5 backdrop-blur-xl">
            <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{title}</h3>
            <div className="mt-5 text-base leading-7 text-slate-100/92">{body}</div>
          </div>
          {cta ? (
            <div className="mt-6">
              <ShadcnButton href={cta.href} variant="outline" className="px-5 py-2.5 text-sm">
                {cta.label}
              </ShadcnButton>
            </div>
          ) : null}

        </div>

        <div className={reverse ? "lg:order-1" : ""}>
          {imageSrc ? (
            <div className="relative">
              <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-r from-violet-500/10 to-cyan-400/8 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-slate-950/50 p-3 shadow-[0_18px_70px_rgba(2,6,23,0.34)] ring-1 ring-white/5 backdrop-blur-2xl">
                <div className="rounded-[1.15rem] border border-white/8 bg-slate-950/90 p-2.5">
                  <Image src={imageSrc} alt={typeof title === "string" ? title : "Preview"} width={1200} height={760} className="h-auto w-full rounded-[0.9rem] object-cover" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
