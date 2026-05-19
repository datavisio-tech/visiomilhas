import { describe, it, expect, vi } from "vitest";
import { createPurchaseAction } from "../actions";

function makeForm(data: Record<string, any>) {
  return {
    entries() {
      return Object.entries(data);
    },
  } as any;
}

describe("createPurchaseAction (unit)", () => {
  it("flag off -> uses legacy flow and does not call acquireMilesUseCase", async () => {
    const mockAdmClient = {
      query: vi.fn(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT id FROM organizations")) return { rows: [{ id: 1 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const mockAppClient = {
      queries: [] as any[],
      query: vi.fn(async (sql: string, params: any[]) => {
        mockAppClient.queries.push(sql);
        if (sql.includes("SELECT current_points_balance")) return { rows: [{ current_points_balance: 0, current_avg_cost_per_thousand_cents: 0, current_cost_basis_cents: 0 }] };
        if (sql.startsWith("INSERT INTO mile_purchases")) return { rows: [{ id: 123 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const deps = {
      admPool: () => ({ connect: async () => mockAdmClient }),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => false,
      acquireMilesUseCase: vi.fn(),
    };

    const form = makeForm({ programId: "1", accountId: "10", points: "100", totalCostCents: "1000" });
    const res = await createPurchaseAction(form, deps as any);

    expect(res.success).toBe(true);
    expect(deps.acquireMilesUseCase).not.toHaveBeenCalled();
    expect(mockAppClient.query).toHaveBeenCalled();
    // ensure commit was called
    expect(mockAppClient.queries.some((q: string) => q.includes("COMMIT"))).toBe(true);
  });

  it("flag on -> calls acquireMilesUseCase and commits after", async () => {
    const mockAdmClient = {
      query: vi.fn(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT id FROM organizations")) return { rows: [{ id: 2 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const mockAppClient = {
      queries: [] as any[],
      query: vi.fn(async (sql: string, params: any[]) => {
        mockAppClient.queries.push(sql);
        if (sql.includes("SELECT current_points_balance")) return { rows: [{ current_points_balance: 0, current_avg_cost_per_thousand_cents: 0, current_cost_basis_cents: 0 }] };
        if (sql.startsWith("INSERT INTO mile_purchases")) return { rows: [{ id: 555 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const acquireMock = vi.fn(async (_input: any, _repo?: any) => {
      // simulate some work
      return { ok: true };
    });

    const deps = {
      admPool: () => ({ connect: async () => mockAdmClient }),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      acquireMilesUseCase: acquireMock,
    };

    const form = makeForm({ programId: "1", accountId: "10", points: "50", totalCostCents: "500" });
    const res = await createPurchaseAction(form, deps as any);

    expect(res.success).toBe(true);
    expect(acquireMock).toHaveBeenCalled();
    expect(mockAppClient.queries.some((q: string) => q.includes("COMMIT"))).toBe(true);
  });

  it("flag on + use-case throws -> rollback occurs and error propagates", async () => {
    const mockAdmClient = {
      query: vi.fn(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT id FROM organizations")) return { rows: [{ id: 9 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const mockAppClient = {
      queries: [] as any[],
      query: vi.fn(async (sql: string, params: any[]) => {
        mockAppClient.queries.push(sql);
        if (sql.includes("SELECT current_points_balance")) return { rows: [{ current_points_balance: 0, current_avg_cost_per_thousand_cents: 0, current_cost_basis_cents: 0 }] };
        if (sql.startsWith("INSERT INTO mile_purchases")) return { rows: [{ id: 999 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const acquireMock = vi.fn(async () => {
      throw new Error("simulated failure in movements engine");
    });

    const deps = {
      admPool: () => ({ connect: async () => mockAdmClient }),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      acquireMilesUseCase: acquireMock,
    };

    const form = makeForm({ programId: "1", accountId: "10", points: "5", totalCostCents: "50" });
    await expect(createPurchaseAction(form, deps as any)).rejects.toThrow("simulated failure in movements engine");

    // ensure rollback was called (a ROLLBACK query should be present)
    expect(mockAppClient.queries.some((q: string) => q.includes("ROLLBACK"))).toBe(true);
    expect(mockAppClient.queries.some((q: string) => q.includes("COMMIT"))).toBe(false);
  });
});
