import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl space-y-1">
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold text-slate-950 sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm leading-6 text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
