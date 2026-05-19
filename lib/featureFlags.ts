/**
 * Helper para feature flags relacionadas ao engine de movimentos.
 * Defaults: flag ausente -> false
 */
export function isFifoMovementsEngineEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  const v = env.USE_FIFO_MOVEMENTS_ENGINE;
  return v === "1" || v === "true" || v === "on";
}

export default { isFifoMovementsEngineEnabled };
