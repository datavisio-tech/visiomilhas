/**
 * Helper para feature flags relacionadas ao engine de movimentos.
 * Defaults: flag ausente -> false
 */
export function isFifoMovementsEngineEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  const raw = (env.USE_FIFO_MOVEMENTS_ENGINE ?? "").toString();
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

export default { isFifoMovementsEngineEnabled };
