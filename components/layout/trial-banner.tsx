type TrialBannerProps = {
  tone?: "info" | "warning";
  title?: string;
  description?: string;
};

export default function TrialBanner({
  tone = "info",
  title = "Período de avaliação: 15 dias restantes",
  description = "Explore todos os recursos enquanto o trial estiver ativo.",
}: TrialBannerProps) {
  const styles =
    tone === "warning"
      ? "bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200"
      : "bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200";
  const titleStyles = tone === "warning" ? "text-amber-900" : "text-blue-900";
  const badgeStyles =
    tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div
      className={`${styles} border rounded-card p-card-p-lg shadow-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div>
        <strong className={`${titleStyles} text-sm font-semibold`}>
          {title}
        </strong>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
      <div
        className={`${badgeStyles} rounded-full px-4 py-2 text-xs font-semibold text-nowrap flex-shrink-0`}
      >
        Trial ativo
      </div>
    </div>
  );
}
