export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center p-8 bg-white border rounded">
      <div className="text-lg font-semibold">{title}</div>
      {description && (
        <div className="text-sm text-gray-500 mt-2">{description}</div>
      )}
    </div>
  );
}
