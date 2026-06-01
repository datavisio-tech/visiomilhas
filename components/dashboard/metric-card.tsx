type MetricCardProps = {
  title: string;
  value: string | number;
  caption?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  compact?: boolean;
  footer?: string;
};

const toneStyles = {
  neutral:
    "border-slate-200 bg-white text-slate-950 shadow-card hover:shadow-card-hover",
  success:
    "border-emerald-100 bg-emerald-50/50 text-slate-950 shadow-card hover:shadow-card-hover",
  warning:
    "border-amber-100 bg-amber-50/50 text-slate-950 shadow-card hover:shadow-card-hover",
  danger:
    "border-rose-100 bg-rose-50/50 text-slate-950 shadow-card hover:shadow-card-hover",
} as const;

const accentStyles = {
  neutral: "bg-slate-300",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
} as const;

export default function MetricCard({
  title,
  value,
  caption,
  tone = "neutral",
  footer,
  compact = false,
}: MetricCardProps) {
  const containerPadding = compact ? "p-4" : "p-card-p-lg";
  const valueClass = compact
    ? "mt-4 text-3xl font-bold"
    : "mt-6 text-4xl font-bold tracking-[-0.02em]";
  const accentSize = compact ? "h-1 w-8" : "h-1 w-12";

  return (
    <div
      className={`rounded-card border ${containerPadding} transition-shadow duration-200 ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-label-xs font-semibold text-slate-500">
            {title}
          </div>
          <div className={`${valueClass} text-slate-950`}>{value}</div>
        </div>
        <div
          className={`${accentSize} rounded-full flex-shrink-0 ${accentStyles[tone]}`}
        />
      </div>
      {caption ? (
        <div className={`mt-3 text-sm leading-6 text-slate-600`}>{caption}</div>
      ) : null}
      {footer ? (
        <div className="mt-3 text-label-xs text-slate-400">{footer}</div>
      ) : null}
    </div>
  );
}
