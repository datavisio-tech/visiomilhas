import { appDb, appPool } from "../../../../db/app/client";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  purchase_records,
  purchase_status_history,
  purchase_evidences,
} from "../../../../db/app/schema";
import { eq, sql } from "drizzle-orm";

function toDateOrUndefined(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function createDrizzlePurchasesRepo(db = appDb()) {
  async function findById(id: number) {
    const rows = await db
      .select()
      .from(purchase_records)
      .where(eq(purchase_records.id, id))
      .limit(1);
    return (rows as any[])[0] ?? null;
  }

  async function insertPurchase(p: any) {
    const res = await db
      .insert(purchase_records)
      .values({
        organizationId: p.organizationId,
        accountId: p.accountId ?? undefined,
        programId: p.programId ?? undefined,
        partnerStoreId: p.partnerStoreId ?? undefined,
        partnerCampaignId: p.partnerCampaignId ?? undefined,
        title: p.title ?? null,
        orderNumber: p.orderNumber ?? null,
        purchaseDate: toDateOrUndefined(p.purchaseDate) ?? new Date(),
        purchaseAmountCents: p.purchaseAmountCents ?? 0,
        freightCents: p.freightCents ?? 0,
        otherCostsCents: p.otherCostsCents ?? 0,
        expectedPoints: p.expectedPoints ?? 0,
        creditedPoints: p.creditedPoints ?? 0,
        multiplier: p.multiplier ?? 0,
        status: p.status ?? "REGISTERED",
        expectedCreditDate: toDateOrUndefined(p.expectedCreditDate),
        creditedAt: toDateOrUndefined(p.creditedAt),
        notes: p.notes ?? null,
        createdAt: toDateOrUndefined(p.createdAt) ?? new Date(),
        updatedAt: toDateOrUndefined(p.updatedAt) ?? new Date(),
      } as any)
      .returning();
    const row = (res as any[])[0];
    return { id: row.id };
  }

  async function updateStatus(
    purchaseId: number,
    oldStatus: string | null,
    newStatus: string,
    notes?: string,
  ) {
    // update purchase
    await db
      .update(purchase_records)
      .set({ status: newStatus })
      .where(eq(purchase_records.id, purchaseId));
    // insert history
    await db.insert(purchase_status_history).values({
      purchaseId,
      oldStatus,
      newStatus,
      notes: notes ?? null,
      createdAt: new Date(),
    } as any);
  }

  async function insertEvidence(purchaseId: number, e: any) {
    const res = await db
      .insert(purchase_evidences)
      .values({
        purchaseId,
        fileName: e.fileName ?? null,
        fileType: e.fileType ?? null,
        fileUrl: e.fileUrl ?? null,
        uploadedAt: e.uploadedAt ?? new Date(),
      } as any)
      .returning();
    return (res as any[])[0];
  }

  async function getStatusHistory(purchaseId: number) {
    const rows = await db
      .select()
      .from(purchase_status_history)
      .where(eq(purchase_status_history.purchaseId, purchaseId))
      .orderBy(sql`created_at ASC`);
    return rows as any[];
  }

  async function listEvidences(purchaseId: number) {
    const rows = await db
      .select()
      .from(purchase_evidences)
      .where(eq(purchase_evidences.purchaseId, purchaseId));
    return rows as any[];
  }

  async function deletePurchase(purchaseId: number) {
    // remove evidences, history then purchase record
    await db
      .delete(purchase_evidences)
      .where(eq(purchase_evidences.purchaseId, purchaseId));
    await db
      .delete(purchase_status_history)
      .where(eq(purchase_status_history.purchaseId, purchaseId));
    await db
      .delete(purchase_records)
      .where(eq(purchase_records.id, purchaseId));
  }

  async function listPurchases(filters: any = {}, limit = 50, offset = 0) {
    let q: any = db.select().from(purchase_records);
    if (filters.organizationId)
      q = q.where(eq(purchase_records.organizationId, filters.organizationId));
    if (filters.status)
      q = q.where(eq(purchase_records.status, filters.status));
    if (filters.partnerStoreId)
      q = q.where(eq(purchase_records.partnerStoreId, filters.partnerStoreId));
    if (filters.q) {
      const like = `%${filters.q}%`;
      q = q.where(
        sql`${purchase_records.title} ILIKE ${like} OR ${purchase_records.orderNumber} ILIKE ${like}`,
      );
    }
    const rows = (await q.limit(limit).offset(offset)) as any[];

    // enrich rows with accountName and programName when possible
    if (rows.length === 0) return rows;

    const accountIds = Array.from(
      new Set(rows.map((r) => Number(r.accountId)).filter(Boolean)),
    );

    const client = await appPool().connect();
    try {
      if (accountIds.length) {
        const accRes = await client.query(
          `SELECT pa.id, pa.nickname, pa.holder_name, pa.program_id, lp.name as program_name
           FROM program_accounts pa
           LEFT JOIN loyalty_programs lp ON pa.program_id = lp.id
           WHERE pa.id = ANY($1)`,
          [accountIds],
        );
        const accMap: Record<number, any> = {};
        accRes.rows.forEach((a: any) => (accMap[Number(a.id)] = a));

        rows.forEach((r) => {
          const aid = Number(r.accountId || 0);
          const acc = accMap[aid];
          if (acc) {
            r.accountName =
              acc.nickname || acc.holder_name || `Conta ${acc.id}`;
            r.programId = Number(acc.program_id || r.programId || null);
            r.programName = acc.program_name || r.programName || null;
          }
        });
      }

      // for any remaining rows without programName, try to fetch program names in batch
      const missingProgramIds = Array.from(
        new Set(
          rows
            .map((r) => Number(r.programId))
            .filter(
              (v) =>
                v &&
                !rows.find(
                  (x) =>
                    x.programName && Number(x.programId) === v && x.programName,
                ),
            ),
        ),
      ).filter(Boolean as any);

      if (missingProgramIds.length) {
        const pRes = await client.query(
          `SELECT id, name FROM loyalty_programs WHERE id = ANY($1)`,
          [missingProgramIds],
        );
        const pMap: Record<number, any> = {};
        pRes.rows.forEach((p: any) => (pMap[Number(p.id)] = p));
        rows.forEach((r) => {
          const pid = Number(r.programId || 0);
          if (pid && !r.programName && pMap[pid])
            r.programName = pMap[pid].name;
        });
      }
    } finally {
      client.release();
    }

    return rows as any[];
  }

  async function kpiCountsByStatus(organizationId: number) {
    const rows: any = await db
      .select({ status: purchase_records.status, count: sql`count(*)::int` })
      .from(purchase_records)
      .where(eq(purchase_records.organizationId, organizationId));
    return rows;
  }

  return {
    findById,
    insertPurchase,
    updateStatus,
    insertEvidence,
    listPurchases,
    kpiCountsByStatus,
    getStatusHistory,
    listEvidences,
    deletePurchase,
  } as const;
}

export default createDrizzlePurchasesRepo;

export function createDrizzlePurchasesRepoFromClient(client: any) {
  const db = drizzle(client as any);
  const base = createDrizzlePurchasesRepo(db as any);
  return {
    ...base,
    runInTransaction: async (cb: any) => cb(base),
  } as any;
}
