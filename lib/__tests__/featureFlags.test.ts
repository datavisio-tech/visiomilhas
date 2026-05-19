import { describe, it, expect } from "vitest";
import { isFifoMovementsEngineEnabled } from "../featureFlags";

describe("featureFlags", () => {
  it("returns false by default", () => {
    const env: any = {};
    expect(isFifoMovementsEngineEnabled(env)).toBe(false);
  });

  it("accepts 'true' and '1' and 'on' as enabled", () => {
    expect(
      isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "true" }),
    ).toBe(true);
    expect(
      isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "1" }),
    ).toBe(true);
    expect(
      isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "on" }),
    ).toBe(true);
  });
});
