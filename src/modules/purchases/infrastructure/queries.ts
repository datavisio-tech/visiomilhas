import { appDb } from "../../../../db/app/client";
import { purchase_records } from "../../../../db/app/schema";
import { and, eq, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "logs");
function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });
  } catch (err) {
    // ignore
  }
}

function writeSqlErrorLog(payload: any) {
  ensureLogDir();
  try {
    const file = path.join(LOG_PATH, "purchases-sql-errors.log");
    fs.appendFileSync(
      file,
      JSON.stringify({ ts: new Date().toISOString(), ...payload }) + "\n",
    );
  } catch (err) {
    // ignore
  }
}

export async function kpiCounts(
  organizationId: number,
  accountId?: number | null,
) {
  const db = appDb();
  const queryText = `select status, count(*)::int from purchase_records where organization_id = $1`;
  const params = [organizationId, accountId ?? null];
  try {
    const conditions = [eq(purchase_records.organizationId, organizationId)];
    if (Number.isFinite(accountId as number)) {
      conditions.push(eq(purchase_records.accountId, Number(accountId)));
    }

    const rows: any = await db
      .select({ status: purchase_records.status, count: sql`count(*)::int` })
      .from(purchase_records)
      .where(and(...conditions))
      .groupBy(purchase_records.status);
    const map: Record<string, number> = {};
    (rows as any[]).forEach((r) => (map[r.status] = Number(r.count ?? 0)));
    return map;
  } catch (error: any) {
    // Log detailed information for diagnosis
    const payload = {
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
      query: `${queryText}${Number.isFinite(accountId as number) ? " and account_id = $2" : ""}`,
      params,
    };
    console.error("[purchases.kpiCounts] SQL error:", payload);
    writeSqlErrorLog(payload);
    // Fallback defensivo enquanto tabela/coluna não estiver disponível
    return {
      REGISTERED: 0,
      TRACKED: 0,
      PENDING_CREDIT: 0,
      RECEIVED: 0,
      PROBLEM: 0,
    } as Record<string, number>;
  }
}

export async function purchasesFilterQuery(
  filters: any = {},
  limit = 50,
  offset = 0,
) {
  const db = appDb();
  try {
    let q: any = db.select().from(purchase_records);
    if (filters.organizationId)
      q = q.where(eq(purchase_records.organizationId, filters.organizationId));
    if (filters.status)
      q = q.where(eq(purchase_records.status, filters.status));
    if (filters.q) {
      const like = `%${filters.q}%`;
      q = q.where(
        sql`${purchase_records.title} ILIKE ${like} OR ${purchase_records.orderNumber} ILIKE ${like}`,
      );
    }
    const rows = await q.limit(limit).offset(offset);
    return rows as any[];
  } catch (error: any) {
    const payload = {
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
      query: "purchasesFilterQuery",
      params: { filters, limit, offset },
    };
    console.error("[purchases.purchasesFilterQuery] SQL error:", payload);
    writeSqlErrorLog(payload);
    return [];
  }
}
