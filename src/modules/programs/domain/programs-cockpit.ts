import type { ProgramsCockpitPeriod } from "../../../../lib/data/programs";

export type ProgramsCockpitTab =
  | "movements"
  | "summary"
  | "statement"
  | "charts"
  | "pending"
  | "subscriptions";

export const PROGRAMS_COCKPIT_TABS: Array<{
  id: ProgramsCockpitTab;
  label: string;
}> = [
  { id: "movements", label: "Movimentações" },
  { id: "statement", label: "Extrato" },
  { id: "summary", label: "Resumo" },
  { id: "charts", label: "Gráficos" },
  { id: "pending", label: "Pendências" },
  { id: "subscriptions", label: "Assinaturas" },
];

export const PROGRAMS_COCKPIT_PERIODS: Array<{
  id: ProgramsCockpitPeriod;
  label: string;
}> = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses" },
];

export function parseProgramsCockpitTab(
  value: string | string[] | undefined,
): ProgramsCockpitTab {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (
    rawValue === "movements" ||
    rawValue === "statement" ||
    rawValue === "charts" ||
    rawValue === "pending" ||
    rawValue === "subscriptions"
  ) {
    return rawValue;
  }
  return "movements";
}

export function parseProgramsCockpitPeriod(
  value: string | string[] | undefined,
): ProgramsCockpitPeriod {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "90d" || rawValue === "12m") {
    return rawValue;
  }
  return "30d";
}
