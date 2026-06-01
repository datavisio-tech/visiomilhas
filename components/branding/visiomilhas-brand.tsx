type VisioMilhasBrandProps = {
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

export default function VisioMilhasBrand({
  subtitle = "Acesse sua central operacional.",
  compact = false,
  className = "",
}: VisioMilhasBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 text-sm font-bold text-white shadow-[0_16px_36px_rgba(99,102,241,0.24)]">
        VM
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          VisioMilhas
        </div>
        {!compact ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
