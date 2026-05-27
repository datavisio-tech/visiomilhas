type MetricCardProps = {
  title: string;
  value: string | number;
  caption?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
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
}: MetricCardProps) {
  return (
    <div
      className={`rounded-card border p-card-p-lg transition-shadow duration-200 ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="text-label-xs font-semibold text-slate-500">
            {title}
          </div>
          <div className="mt-6 text-4xl font-bold tracking-[-0.02em] text-slate-950">
            {value}
          </div>
        </div>
        <div
          className={`h-1 w-12 rounded-full flex-shrink-0 ${accentStyles[tone]}`}
        />
      </div>
      {caption ? (
        <div className="mt-5 text-sm leading-6 text-slate-600">{caption}</div>
      ) : null}
      {footer ? (
        <div className="mt-4 text-label-xs text-slate-400">{footer}</div>
      ) : null}
    </div>
  );
}
