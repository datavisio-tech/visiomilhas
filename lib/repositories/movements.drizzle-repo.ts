import { appDb } from "../../db/app/client";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  mile_entries,
  mile_point_lots,
  program_accounts,
  mile_transfers,
} from "../../db/app/schema";
import type {
  MileEntryRecord,
  MilePointLotRecord,
  TransferRecord,
  PointLot,
} from "../services/movements";
import { eq } from "drizzle-orm";

/**
 * Cria um MovementsRepo concreto usando Drizzle (node-postgres).
 * Observações:
 * - Não executa migrations nem seeds.
 * - Fornece helper `runInTransaction` que usa `db.transaction` do Drizzle.
 */
export function createDrizzleMovementsRepo(db = appDb()) {
  async function findAccountById(accountId: number) {
    const rows = await db
      .select()
      .from(program_accounts)
      .where(eq(program_accounts.id, accountId))
      .limit(1);
    const r = (rows as any[])[0];
    return r ? { id: r.id } : null;
  }

  async function insertEntry(entry: MileEntryRecord) {
    const res = await db
      .insert(mile_entries)
      .values({
        organizationId: entry.organizationId ?? undefined,
        programId: entry.programId ?? undefined,
        accountId: entry.accountId ?? undefined,
        type: entry.type ?? null,
        direction: entry.direction ?? null,
        points: entry.points ?? null,
        amountCents: entry.amountCents ?? undefined,
        occurredAt: entry.occurredAt ?? new Date(),
        description: entry.description ?? null,
        source: entry.source ?? null,
        status: entry.status ?? "posted",
        metadata: entry.metadata ?? undefined,
        createdAt: entry.createdAt ?? new Date(),
        updatedAt: entry.updatedAt ?? new Date(),
        consumedLotId: entry.consumedLotId ?? undefined,
        consumedPoints: entry.consumedPoints ?? undefined,
        lotSnapshot: entry.lotSnapshot ?? undefined,
      } as any)
      .returning();

    const row = (res as any[])[0];
    return { id: row.id };
  }

  async function insertLot(lot: MilePointLotRecord) {
    const res = await db
      .insert(mile_point_lots)
      .values({
        organizationId: lot.organizationId ?? undefined,
        programId: lot.programId ?? undefined,
        accountId: lot.accountId,
        sourceEntryId: lot.sourceEntryId ?? undefined,
        acquiredPoints: lot.acquiredPoints,
        remainingPoints: lot.remainingPoints,
        totalCostCents: lot.totalCostCents ?? undefined,
        costPerThousandCents: lot.costPerThousandCents ?? undefined,
        issuedAt: lot.issuedAt ?? new Date(),
        expiresAt: lot.expiresAt ?? undefined,
        status: lot.status ?? "available",
        metadata: lot.metadata ?? undefined,
        createdAt: lot.createdAt ?? new Date(),
        updatedAt: lot.updatedAt ?? new Date(),
      } as any)
      .returning();

    const row = (res as any[])[0];
    return { id: row.id };
  }

  async function updateLotRemaining(lotId: number, remaining: number) {
    await db
      .update(mile_point_lots)
      .set({ remainingPoints: remaining })
      .where(eq(mile_point_lots.id, lotId));
  }

  async function updateProgramAccountBalance(
    accountId: number,
    deltaPoints: number,
  ) {
    // Read current balance and update to avoid dialect-specific arithmetic in set
    const rows = await db
      .select()
      .from(program_accounts)
      .where(eq(program_accounts.id, accountId))
      .limit(1);
    const acc = (rows as any[])[0];
    if (!acc) throw new Error("account not found");
    const current = (acc.currentPointsBalance ?? 0) as number;
    const next = current + deltaPoints;
    await db
      .update(program_accounts)
      .set({ currentPointsBalance: next })
      .where(eq(program_accounts.id, accountId));
  }

  async function getAvailableLots(accountId: number): Promise<PointLot[]> {
    const rows = await db
      .select()
      .from(mile_point_lots)
      .where(eq(mile_point_lots.accountId, accountId));
    // Filter in JS to avoid relying on DB-specific functions here; order by issued_at asc then id asc (FIFO)
    const filtered = (rows as any[])
      .filter((r) => (r.remaining_points ?? 0) > 0 && r.status === "available")
      .sort((a, b) => {
        const ta = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
        const tb = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
        if (ta !== tb) return ta - tb;
        return a.id - b.id;
      })
      .map((r) => ({
        id: r.id,
        accountId: r.accountId,
        acquiredPoints: r.acquiredPoints,
        remainingPoints: r.remainingPoints,
        issuedAt: r.issuedAt,
        expiresAt: r.expiresAt,
        sourceEntryId: r.sourceEntryId,
      }));

    return filtered;
  }

  async function insertTransfer(transfer: TransferRecord) {
    const res = await db
      .insert(mile_transfers)
      .values({
        organizationId: transfer.organizationId ?? undefined,
        fromProgramId: undefined,
        fromAccountId: transfer.fromAccountId ?? undefined,
        toProgramId: undefined,
        toAccountId: transfer.toAccountId ?? undefined,
        pointsSent: transfer.pointsSent ?? undefined,
        pointsReceived: transfer.pointsReceived ?? undefined,
        transferredAt: transfer.transferredAt ?? new Date(),
        status: transfer.status ?? "posted",
        description: transfer.description ?? undefined,
        createdAt: transfer.createdAt ?? new Date(),
        updatedAt: transfer.updatedAt ?? new Date(),
      } as any)
      .returning();
    const row = (res as any[])[0];
    return { id: row.id };
  }

  function runInTransaction(cb: any) {
    return db.transaction(cb as any);
  }

  return {
    findAccountById,
    insertEntry,
    insertLot,
    updateLotRemaining,
    updateProgramAccountBalance,
    getAvailableLots,
    insertTransfer,
    runInTransaction,
  } as any;
}

export default createDrizzleMovementsRepo;

// Create a MovementsRepo bound to an existing `pg` client connection.
// This allows running repo operations on the same client/transaction already
// started by higher-level code (e.g. Server Action using `client.query("BEGIN")`).
export function createDrizzleMovementsRepoFromClient(client: any) {
  const db = drizzle(client as any);

  const base = createDrizzleMovementsRepo(db as any);

  // When bound to an existing client/transaction, `runInTransaction` should
  // *not* start a new transaction; instead just execute the callback and
  // pass the repo as the tx-like object so higher-level code controls the
  // commit/rollback.
  const repo = {
    ...base,
    runInTransaction: async (cb: any) => {
      return cb(base);
    },
  } as any;

  return repo;
}
