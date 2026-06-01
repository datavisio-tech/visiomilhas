import type { AccountOperationalTimelineItem } from "../../lib/data/programs";

type Props = {
  timeline: AccountOperationalTimelineItem[];
};

export default function ProgramTimeline({ timeline }: Props) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-sm font-semibold text-slate-700">Linha do tempo</div>
      <div className="mt-3 space-y-3">
        {timeline.length === 0 ? (
          <div className="text-sm text-slate-500">
            Nenhum movimento registrado para esta conta.
          </div>
        ) : (
          timeline.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </div>
                </div>
                <div
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone === "success" ? "bg-emerald-50 text-emerald-700" : item.tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}
                >
                  {item.date
                    ? new Date(item.date).toLocaleDateString("pt-BR")
                    : "—"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
