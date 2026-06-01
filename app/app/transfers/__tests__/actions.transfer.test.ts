import { describe, it, expect, vi } from "vitest";
import { createTransferAction } from "../actions";

function makeForm(data: Record<string, any>) {
  return {
    entries() {
      return Object.entries(data);
    },
  } as any;
}

describe("createTransferAction (FIFO)", () => {
  it("commits only after transferMilesUseCase succeeds", async () => {
    const events: string[] = [];
    const mockAppClient = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT current_points_balance")) {
          return {
            rows: [
              {
                current_points_balance: 150,
                current_avg_cost_per_thousand_cents: 200,
              },
            ],
          };
        }

        if (sql.startsWith("INSERT INTO mile_transfers")) {
          return { rows: [{ id: 401 }] };
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

    const transferMock = vi.fn(async () => {
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
          organizationId: 8,
          ownsAccount: true,
          ownsOrganizationScope: true,
        },
      }),
      resolveOwnedAccount: vi.fn(async () => ({
        ownership: { organizationId: 8 },
      })),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      transferMilesUseCase: transferMock,
      revalidatePath: () => undefined,
    };

    const form = makeForm({
      fromAccountId: "11",
      toAccountId: "12",
      pointsSent: "25",
      feeCents: "0",
      bonusPercent: "0",
      totalAmountCents: "0",
    });

    const result = await createTransferAction(form, deps as any);

    expect(result.success).toBe(true);
    expect(transferMock).toHaveBeenCalled();
    expect(events.indexOf("usecase")).toBeGreaterThan(-1);
    expect(events.indexOf("commit")).toBeGreaterThan(-1);
    expect(events.indexOf("usecase")).toBeLessThan(events.indexOf("commit"));
  });

  it("rolls back when transferMilesUseCase throws", async () => {
    const mockAppClient = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT current_points_balance")) {
          return {
            rows: [
              {
                current_points_balance: 150,
                current_avg_cost_per_thousand_cents: 200,
              },
            ],
          };
        }

        if (sql.startsWith("INSERT INTO mile_transfers")) {
          return { rows: [{ id: 402 }] };
        }

        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const transferMock = vi.fn(async () => {
      throw new Error("transfer fifo failure");
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
          organizationId: 8,
          ownsAccount: true,
          ownsOrganizationScope: true,
        },
      }),
      resolveOwnedAccount: vi.fn(async () => ({
        ownership: { organizationId: 8 },
      })),
      appPool: () => ({ connect: async () => mockAppClient }),
      isFifoMovementsEngineEnabled: () => true,
      transferMilesUseCase: transferMock,
      revalidatePath: () => undefined,
    };

    const form = makeForm({
      fromAccountId: "11",
      toAccountId: "12",
      pointsSent: "25",
      feeCents: "0",
      bonusPercent: "0",
      totalAmountCents: "0",
    });

    await expect(createTransferAction(form, deps as any)).rejects.toThrow(
      "transfer fifo failure",
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