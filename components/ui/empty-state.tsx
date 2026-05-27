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
    <div className="rounded-card border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-12 text-center shadow-card">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200/50 mb-4">
        <svg
          className="h-6 w-6 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M20 21l-4.35-4.35m0 0a7 7 0 10-9.9 0l4.35 4.35M9 10a3 3 0 100-6 3 3 0 000 6z"
          />
        </svg>
      </div>
      <div className="text-xl font-semibold text-slate-950">{title}</div>
      {description ? (
        <div className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </div>
      ) : null}
      {supportingText ? (
        <div className="mx-auto mt-4 max-w-md text-label-xs text-slate-400">
          {supportingText}
        </div>
      ) : null}
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-card"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
