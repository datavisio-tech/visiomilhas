import { describe, it, expect, vi } from "vitest";
import { createSaleAction } from "../actions";

function makeForm(data: Record<string, any>) {
  return {
    entries() {
      return Object.entries(data);
    },
  } as any;
}

describe("createSaleAction (FIFO)", () => {
  it("commits only after consumeMilesUseCase succeeds", async () => {
    const events: string[] = [];
    const mockAppClient = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT current_points_balance")) {
          return {
            rows: [
              {
                current_points_balance: 100,
                current_avg_cost_per_thousand_cents: 200,
              },
            ],
          };
        }

        if (sql.startsWith("INSERT INTO mile_sales")) {
          return { rows: [{ id: 321 }] };
        }

        if (sql.includes("COMMIT")) {
          events.push("commit");
        }

        if (sql.includes("ROLLBACK")) {
          events.push("rollback");
        }

        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const consumeMock = vi.fn(async () => {
      events.push("usecase");
      return { ok: true };
    });

    const deps = {
      resolveSessionContext: async () => ({
        auth: {
          userId: "user-1",
          authProvider: "internal",
          isAuthenticated: true,
        },
        ownership: {
          userId: "user-1",
          organizationId: 7,
          ownsAccount: true,
          ownsOrganizationScope: true,
        },
      }),
      resolveOwnedAccount: vi.fn(async () => ({
        ownership: { organizationId: 7 },
      })),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      consumeMilesUseCase: consumeMock,
      revalidatePath: () => undefined,
    };

    const form = makeForm({
      programId: "1",
      accountId: "10",
      points: "15",
      totalAmountCents: "300",
    });

    const result = await createSaleAction(form, deps as any);

    expect(result.success).toBe(true);
    expect(consumeMock).toHaveBeenCalled();
    expect(events.indexOf("usecase")).toBeGreaterThan(-1);
    expect(events.indexOf("commit")).toBeGreaterThan(-1);
    expect(events.indexOf("usecase")).toBeLessThan(events.indexOf("commit"));
  });

  it("rolls back when consumeMilesUseCase throws", async () => {
    const mockAppClient = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT current_points_balance")) {
          return {
            rows: [
              {
                current_points_balance: 100,
                current_avg_cost_per_thousand_cents: 200,
              },
            ],
          };
        }

        if (sql.startsWith("INSERT INTO mile_sales")) {
          return { rows: [{ id: 322 }] };
        }

        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const consumeMock = vi.fn(async () => {
      throw new Error("sale fifo failure");
    });

    const deps = {
      resolveSessionContext: async () => ({
        auth: {
          userId: "user-1",
          authProvider: "internal",
          isAuthenticated: true,
        },
        ownership: {
          userId: "user-1",
          organizationId: 7,
          ownsAccount: true,
          ownsOrganizationScope: true,
        },
      }),
      resolveOwnedAccount: vi.fn(async () => ({
        ownership: { organizationId: 7 },
      })),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      consumeMilesUseCase: consumeMock,
      revalidatePath: () => undefined,
    };

    const form = makeForm({
      programId: "1",
      accountId: "10",
      points: "15",
      totalAmountCents: "300",
    });

    await expect(createSaleAction(form, deps as any)).rejects.toThrow(
      "sale fifo failure",
    );

    expect(
      mockAppClient.query.mock.calls.some(([sql]: [string]) =>
        String(sql).includes("ROLLBACK"),
      ),
    ).toBe(true);
    expect(
      mockAppClient.query.mock.calls.some(([sql]: [string]) =>
        String(sql).includes("COMMIT"),
      ),
    ).toBe(false);
  });
});