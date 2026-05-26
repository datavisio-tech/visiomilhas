import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  supportingText?: string;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  supportingText,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      {description ? (
        <div className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {description}
        </div>
      ) : null}
      {supportingText ? (
        <div className="mx-auto mt-3 max-w-md text-xs uppercase tracking-[0.18em] text-slate-400">
          {supportingText}
        </div>
      ) : null}
      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
