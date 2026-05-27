import React from "react";
import Link from "next/link";

type Props = {
  title: string;
  body: React.ReactNode;
  imageSrc?: string;
  reverse?: boolean;
  cta?: { href: string; label: string } | null;
};

export default function MarketingSection({ title, body, imageSrc, reverse = false, cta }: Props) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <div className="mt-4 text-slate-600">{body}</div>
            {cta && (
              <div className="mt-6">
                <Link href={cta.href} className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{cta.label}</Link>
              </div>
            )}
          </div>

          <div className="flex justify-center lg:justify-end">
            {imageSrc ? (
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm">
                <img src={imageSrc} alt={title} className="w-full rounded-lg" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
