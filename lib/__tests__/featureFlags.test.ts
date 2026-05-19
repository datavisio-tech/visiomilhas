import { describe, it, expect } from "vitest";
import { isFifoMovementsEngineEnabled } from "../featureFlags";

describe("featureFlags (stateless)", () => {
  it("returns false by default when env object empty", () => {
    expect(isFifoMovementsEngineEnabled({} as any)).toBe(false);
  });

  it("returns false for empty string, '0', 'false' and invalid values", () => {
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "" })).toBe(false);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "0" })).toBe(false);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "false" })).toBe(false);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "nope" })).toBe(false);
  });

  it("accepts truthy values (1, true, on) case-insensitive and with spaces", () => {
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "1" })).toBe(true);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "true" })).toBe(true);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "on" })).toBe(true);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: " TRUE " })).toBe(true);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: " On " })).toBe(true);
    expect(isFifoMovementsEngineEnabled({ USE_FIFO_MOVEMENTS_ENGINE: "TrUe" })).toBe(true);
  });
});

describe("featureFlags (process.env)", () => {
  const KEY = "USE_FIFO_MOVEMENTS_ENGINE";
  const orig = process.env[KEY];

  afterEach(() => {
    if (orig === undefined) delete process.env[KEY]; else process.env[KEY] = orig;
  });

  it("reads value from process.env and respects defaults", () => {
    process.env[KEY] = "true";
    expect(isFifoMovementsEngineEnabled()).toBe(true);
    process.env[KEY] = "0";
    expect(isFifoMovementsEngineEnabled()).toBe(false);
    delete process.env[KEY];
    expect(isFifoMovementsEngineEnabled()).toBe(false);
  });
});
