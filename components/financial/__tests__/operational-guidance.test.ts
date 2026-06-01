import { describe, expect, it } from "vitest";
import { humanizeWarning, prioritizeWarnings } from "../operational-guidance";

describe("operational guidance", () => {
  it("surfaces explicit recovery actions for balance warnings", () => {
    const guidance = humanizeWarning("saldo negativo detectado");

    expect(guidance.severity).toBe("CRITICAL");
    expect(guidance.action).toContain("reconciliação");
    expect(guidance.recoveryAction).toContain("reconcile de saldo");
    expect(guidance.escalate).toContain("divergência");
  });

  it("prioritizes unique warnings without duplicating recovery guidance", () => {
    const prioritized = prioritizeWarnings([
      "replay divergente",
      "replay divergente",
      "lote órfão",
    ]);

    expect(prioritized).toHaveLength(2);
    expect(prioritized[0].recoveryAction).toBeDefined();
    expect(prioritized[1].recoveryAction).toBeDefined();
  });
});
