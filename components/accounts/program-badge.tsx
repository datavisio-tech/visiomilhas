"use client";
import {
  Bird,
  CircleHelp,
  Plane,
  Sparkles,
  Ticket,
  BadgeDollarSign,
} from "lucide-react";

const programStyles: Record<
  string,
  { label: string; tone: string; Icon: typeof Sparkles }
> = {
  livelo: { label: "Livelo", tone: "bg-violet-500 text-white", Icon: Sparkles },
  "latam pass": {
    label: "LATAM Pass",
    tone: "bg-rose-500 text-white",
    Icon: Plane,
  },
  smiles: { label: "Smiles", tone: "bg-amber-500 text-white", Icon: Ticket },
  azul: { label: "Azul", tone: "bg-sky-500 text-white", Icon: Bird },
  esfera: {
    label: "Esfera",
    tone: "bg-emerald-500 text-white",
    Icon: BadgeDollarSign,
  },
};

function normalize(programName?: string | null) {
  return (programName ?? "").trim().toLowerCase();
}

export default function ProgramBadge({
  programName,
  color,
}: {
  programName?: string | null;
  color?: string | null;
}) {
  const normalized = normalize(programName);
  const brand =
    programStyles[normalized] ??
    ({
      label: programName?.trim() || "Programa",
      tone: "bg-slate-500 text-white",
      Icon: CircleHelp,
    } as const);
  const initials = (brand.label || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div
        suppressHydrationWarning
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color ? "" : brand.tone}`}
        style={color ? { backgroundColor: color } : undefined}
      >
        <brand.Icon className="h-5 w-5 text-white/95" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-950">
            {brand.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {initials}
          </span>
        </div>
        <div className="text-xs text-slate-500">Programa de milhas</div>
      </div>
    </div>
  );
}
