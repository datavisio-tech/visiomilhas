const defaultProgramName = "Programa";

export function normalizeProgramName(programName?: string | null) {
  return programName?.trim() || defaultProgramName;
}

export function buildAccountDisplayName(
  programName?: string | null,
  nickname?: string | null,
) {
  const resolvedProgramName = normalizeProgramName(programName);
  const resolvedNickname = nickname?.trim();

  if (!resolvedNickname) {
    return resolvedProgramName;
  }

  return `${resolvedProgramName} ${resolvedNickname}`.trim();
}

export function calculateInitialCostBasisCents(
  initialBalance: number,
  initialCpmCents: number,
) {
  if (!Number.isFinite(initialBalance) || !Number.isFinite(initialCpmCents)) {
    return 0;
  }

  if (initialBalance <= 0 || initialCpmCents <= 0) {
    return 0;
  }

  return Math.round((initialBalance * initialCpmCents) / 1000);
}

export function formatCpmCents(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) {
    return "—";
  }

  return `R$ ${(cents / 100).toFixed(2)}`;
}
