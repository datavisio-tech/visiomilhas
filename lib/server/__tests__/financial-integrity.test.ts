/* eslint-disable no-unused-vars */
import { describe, it, expect, vi } from "vitest";
import {
  buildAccountIntegritySummary,
  buildFinancialTimeline,
  buildFifoLineage,
  buildFifoIntegritySummary,
  buildLedgerIntegritySummary,
  inspectFinancialAccount,
  inspectFinancialReplay,
  inspectFifoConsumption,
  generateAccountIntegrityReport,
  ensureNoDuplicateSale,
  ensureNoDuplicateTransfer,
  generateFifoIntegrityReport,
  generateLedgerIntegrityReport,
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

  it("builds a deterministic financial timeline and fifo lineage", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM mile_entries")) {
        return {
          rows: [
            {
              id: 1,
              organization_id: 99,
              account_id: 7,
              type: "purchase",
              direction: "credit",
              points: 100,
              amount_cents: 500,
              occurred_at: "2026-05-26T10:00:00.000Z",
              description: "purchase",
              source: "purchase",
              status: "posted",
              consumed_lot_id: null,
              consumed_points: null,
              lot_snapshot: null,
              created_at: "2026-05-26T10:00:00.000Z",
            },
            {
              id: 2,
              organization_id: 99,
              account_id: 7,
              type: "sale",
              direction: "debit",
              points: 40,
              amount_cents: 800,
              occurred_at: "2026-05-26T10:05:00.000Z",
              description: "sale",
              source: null,
              status: "posted",
              consumed_lot_id: 10,
              consumed_points: 40,
              lot_snapshot: {
                consumedLots: [
                  {
                    lotId: 10,
                    consumedPoints: 40,
                    remainingPointsAfterConsumption: 60,
                  },
                ],
              },
              created_at: "2026-05-26T10:05:00.000Z",
            },
            {
              id: 3,
              organization_id: 99,
              account_id: 7,
              type: "transfer",
              direction: "credit",
              points: 60,
              amount_cents: null,
              occurred_at: "2026-05-26T10:10:00.000Z",
              description: "transfer",
              source: null,
              status: "posted",
              consumed_lot_id: null,
              consumed_points: null,
              lot_snapshot: null,
              created_at: "2026-05-26T10:10:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_point_lots")) {
        return {
          rows: [
            {
              id: 10,
              organization_id: 99,
              account_id: 7,
              source_entry_id: 1,
              acquired_points: 100,
              remaining_points: 60,
              total_cost_cents: 500,
              cost_per_thousand_cents: 5000,
              issued_at: "2026-05-26T10:00:00.000Z",
              status: "available",
              created_at: "2026-05-26T10:00:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_transfers")) {
        return {
          rows: [
            {
              id: 3,
              organization_id: 99,
              from_account_id: 7,
              to_account_id: 8,
              points_sent: 60,
              points_received: 60,
              transferred_at: "2026-05-26T10:10:00.000Z",
              status: "posted",
              description: "transfer",
              source_entry_id: 2,
              destination_entry_id: 4,
              created_at: "2026-05-26T10:10:00.000Z",
            },
          ],
        };
      }

      return { rows: [] };
    });

    const timeline = await buildFinancialTimeline(runner as any, {
      organizationId: 99,
      accountId: 7,
    });
    const lineage = await buildFifoLineage(runner as any, {
      organizationId: 99,
      accountId: 7,
    });

    expect(timeline.events.map((event) => event.kind)).toEqual([
      "purchase",
      "lot",
      "sale",
      "transfer",
    ]);
    expect(lineage.nodes.length).toBeGreaterThan(0);
    expect(lineage.nodes.some((node) => node.operationKind === "transfer")).toBe(true);
  });

  it("builds operational summaries and inspections", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM program_accounts")) {
        return {
          rows: [
            {
              id: 7,
              organization_id: 99,
              current_points_balance: 40,
              current_cost_basis_cents: 200,
              current_avg_cost_per_thousand_cents: 5000,
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
              organization_id: 99,
              account_id: 7,
              source_entry_id: 1,
              acquired_points: 100,
              remaining_points: 40,
              total_cost_cents: 500,
              cost_per_thousand_cents: 5000,
              issued_at: "2026-05-26T10:00:00.000Z",
              status: "available",
              created_at: "2026-05-26T10:00:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_entries")) {
        return {
          rows: [
            {
              id: 1,
              organization_id: 99,
              account_id: 7,
              type: "purchase",
              direction: "credit",
              points: 100,
              amount_cents: 500,
              occurred_at: "2026-05-26T10:00:00.000Z",
              description: "purchase",
              source: "purchase",
              status: "posted",
              consumed_lot_id: null,
              consumed_points: null,
              lot_snapshot: null,
              created_at: "2026-05-26T10:00:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_transfers")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const accountSummary = await buildAccountIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const fifoSummary = await buildFifoIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const ledgerSummary = await buildLedgerIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const accountInspection = await inspectFinancialAccount(runner as any, {
      organizationId: 99,
      accountId: 7,
    });
    const fifoInspection = await inspectFifoConsumption(runner as any, {
      organizationId: 99,
      accountId: 7,
    });
    const replayInspection = await inspectFinancialReplay(runner as any, {
      organizationId: 99,
      accountId: 7,
    });

    expect(accountSummary.currentBalance).toBe(40);
    expect(accountSummary.reconciledBalance).toBe(40);
    expect(accountSummary.integrityStatus).toBe("consistent");
    expect(fifoSummary.totalLots).toBe(1);
    expect(fifoSummary.fifoStatus).toBe("consistent");
    expect(ledgerSummary.ledgerStatus).toBe("consistent");
    expect(accountInspection.summary.currentBalance).toBe(40);
    expect(fifoInspection.summary.totalLots).toBe(1);
    expect(replayInspection.summary.ledgerStatus).toBe("consistent");
  });

  it("surfaces operational warnings for inconsistent runtime", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM program_accounts")) {
        return {
          rows: [
            {
              id: 7,
              organization_id: 99,
              current_points_balance: -10,
              current_cost_basis_cents: -50,
              current_avg_cost_per_thousand_cents: 5000,
            },
          ],
        };
      }

      if (sql.includes("FROM mile_point_lots") && sql.includes("LEFT JOIN")) {
        return { rows: [{ id: 20, account_id: 999 }] };
      }

      if (sql.includes("FROM mile_point_lots")) {
        return {
          rows: [
            {
              id: 10,
              organization_id: 99,
              account_id: 7,
              source_entry_id: 1,
              acquired_points: 100,
              remaining_points: 120,
              total_cost_cents: 500,
              cost_per_thousand_cents: 5000,
              issued_at: "2026-05-26T10:00:00.000Z",
              status: "available",
              created_at: "2026-05-26T10:00:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_entries")) {
        return { rows: [] };
      }

      if (sql.includes("FROM mile_transfers")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const accountSummary = await buildAccountIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const fifoSummary = await buildFifoIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const ledgerSummary = await buildLedgerIntegritySummary(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });

    expect(accountSummary.integrityStatus).not.toBe("consistent");
    expect(accountSummary.warnings).toEqual(
      expect.arrayContaining([
        "balance negative",
        "saldo negativo",
        "divergência de saldo",
        "replay divergente",
        "consumo inválido",
        "remaining points inválido",
        "lote órfão",
      ]),
    );
    expect(fifoSummary.warnings).toEqual(
      expect.arrayContaining(["lote órfão", "consumo inválido", "remaining points inválido"]),
    );
    expect(ledgerSummary.warnings.length).toBeGreaterThan(0);
  });

  it("generates account, fifo and ledger integrity reports", async () => {
    const runner = makeRunner((sql) => {
      if (sql.includes("FROM program_accounts")) {
        return {
          rows: [
            {
              id: 7,
              organization_id: 99,
              current_points_balance: 100,
              current_cost_basis_cents: 500,
              current_avg_cost_per_thousand_cents: 5000,
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
              organization_id: 99,
              account_id: 7,
              source_entry_id: 1,
              acquired_points: 100,
              remaining_points: 100,
              total_cost_cents: 500,
              cost_per_thousand_cents: 5000,
              issued_at: "2026-05-26T10:00:00.000Z",
              status: "available",
              created_at: "2026-05-26T10:00:00.000Z",
            },
          ],
        };
      }

      if (sql.includes("FROM mile_entries")) {
        return { rows: [] };
      }

      if (sql.includes("FROM mile_transfers")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const accountReport = await generateAccountIntegrityReport(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const fifoReport = await generateFifoIntegrityReport(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });
    const ledgerReport = await generateLedgerIntegrityReport(runner as any, {
      organizationId: 99,
      accountId: 7,
      emitEvents: false,
    });

    expect(accountReport.accountExists).toBe(true);
    expect(fifoReport.lineageBroken).toBe(false);
    expect(ledgerReport.replayConsistent).toBe(true);
  });
});