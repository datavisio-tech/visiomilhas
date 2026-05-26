type MetricCardProps = {
  title: string;
  value: string | number;
  caption?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  footer?: string;
};

const toneStyles = {
  neutral: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
} as const;

export default function MetricCard({
  title,
  value,
  caption,
  tone = "neutral",
  footer,
}: MetricCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneStyles[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none">{value}</div>
      {caption ? (
        <div className="mt-2 text-sm text-slate-600">{caption}</div>
      ) : null}
      {footer ? (
        <div className="mt-3 text-xs font-medium text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}
