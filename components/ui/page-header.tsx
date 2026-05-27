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
    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <div className="text-label-xs font-semibold text-slate-500">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-4xl font-bold leading-tight text-slate-950">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 flex-shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
