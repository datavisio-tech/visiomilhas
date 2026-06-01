export const validTransitions: Record<string, string[]> = {
  REGISTERED: ["TRACKED", "PROBLEM"],
  TRACKED: ["PENDING_CREDIT", "PROBLEM"],
  PENDING_CREDIT: ["RECEIVED", "PROBLEM"],
  RECEIVED: ["PROBLEM", "APPROVED"],
  PROBLEM: ["RECEIVED"],
};

export function createStateMachine(initialStatus: string | null) {
  const current = initialStatus ?? "REGISTERED";
  return {
    current,
    canTransitionTo(next: string) {
      const allowed = validTransitions[current] ?? [];
      return allowed.includes(next);
    },
  };
}
