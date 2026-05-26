type TrialBannerProps = {
  tone?: "info" | "warning";
  title?: string;
  description?: string;
};

export default function TrialBanner({
  tone = "info",
  title = "Teste PRO: 15 dias restantes",
  description = "Aproveite todos os recursos durante o período de avaliação.",
}: TrialBannerProps) {
  const styles =
    tone === "warning"
      ? "bg-amber-50 border-amber-300"
      : "bg-indigo-50 border-indigo-300";
  const titleStyles = tone === "warning" ? "text-amber-800" : "text-indigo-700";
  return (
    <div className={`${styles} border-l-4 p-3 rounded mb-4`}>
      <strong className={titleStyles}>{title}</strong>
      <div className="text-sm text-gray-600">
        {description}
      </div>
    </div>
  );
}
