/* eslint-disable no-unused-vars */
import { describe, it, expect, vi } from "vitest";
import {
  ensureNoDuplicateSale,
  ensureNoDuplicateTransfer,
  validateFinancialIntegrity,
} from "../financial-integrity";

function makeRunner(mapper: (sql: string, params?: any[]) => any) {
  return {
    query: vi.fn(async (sql: string, params?: any[]) => mapper(sql, params)),
  };
}

describe("financial-integrity", () => {
  it("validates a consistent account balance and lot set", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM program_accounts")) {
        return {
          rows: [
            {
              id: 1,
              current_points_balance: 100,
              current_cost_basis_cents: 200,
              current_avg_cost_per_thousand_cents: 2000,
            },
          ],
        };
      }

      if (sql.includes("FROM mile_point_lots") && sql.includes("LEFT JOIN")) {
        return { rows: [] };
      }

      if (sql.includes("FROM mile_point_lots")) {
        return {
          rows: [
            {
              id: 10,
              account_id: 1,
              acquired_points: 100,
              remaining_points: 100,
              organization_id: 99,
            },
          ],
        };
      }

      return { rows: [] };
    });

    const result = await validateFinancialIntegrity(runner as any, {
      organizationId: 99,
      accountId: 1,
      emitEvents: false,
      source: "test",
    });

    expect(result.isConsistent).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("detects negative balance, orphan lots and divergence", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM program_accounts")) {
        return {
          rows: [
            {
              id: 1,
              current_points_balance: -5,
              current_cost_basis_cents: -10,
              current_avg_cost_per_thousand_cents: 2000,
            },
          ],
        };
      }

      if (sql.includes("FROM mile_point_lots") && sql.includes("LEFT JOIN")) {
        return { rows: [{ id: 88, account_id: 777 }] };
      }

      if (sql.includes("FROM mile_point_lots")) {
        return {
          rows: [
            {
              id: 10,
              account_id: 1,
              acquired_points: 1,
              remaining_points: 2,
              organization_id: 99,
            },
          ],
        };
      }

      return { rows: [] };
    });

    const result = await validateFinancialIntegrity(runner as any, {
      organizationId: 99,
      accountId: 1,
      emitEvents: false,
      source: "test",
    });

    expect(result.isConsistent).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "NEGATIVE_BALANCE_DETECTED",
        "ORPHAN_LOT_DETECTED",
        "FIFO_DIVERGENCE_DETECTED",
        "INVALID_CONSUMPTION_DETECTED",
        "DELTA_INCONSISTENT_DETECTED",
      ]),
    );
  });

  it("blocks duplicate sale and transfer operations", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM mile_sales")) {
        return { rows: [{ id: 501 }] };
      }

      if (sql.includes("FROM mile_transfers")) {
        return { rows: [{ id: 601 }] };
      }

      return { rows: [] };
    });

    await expect(
      ensureNoDuplicateSale(runner as any, {
        organizationId: 99,
        accountId: 1,
        points: 10,
        totalAmountCents: 300,
        soldAt: new Date(),
        description: "dup",
        customerName: "client",
      }),
    ).resolves.toBe(true);

    await expect(
      ensureNoDuplicateTransfer(runner as any, {
        organizationId: 99,
        fromAccountId: 1,
        toAccountId: 2,
        pointsSent: 10,
        pointsReceived: 10,
        feeCents: 0,
        bonusPercent: 0,
        transferredAt: new Date(),
        description: "dup",
      }),
    ).resolves.toBe(true);
  });
});