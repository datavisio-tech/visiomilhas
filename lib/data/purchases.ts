import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "./db-errors";
import { resolveReadScope } from "../server/read-scope";
import { type SessionContext } from "../server/auth-context";

export async function getPurchasesOverview(
  sessionContext?: SessionContext | null,
  limit = 50,
  accountId?: number | null,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const q = `
      SELECT mp.id, mp.points, COALESCE(mp.total_cost_cents, mp.amount_cents) as value_cents, mp.cost_per_thousand_cents, mp.purchased_at::text as purchased_at, mp.status, mp.description,
             lp.name as program_name, pa.nickname as account_nickname, mp.account_id
      FROM mile_purchases mp
      LEFT JOIN loyalty_programs lp ON mp.program_id = lp.id
      LEFT JOIN program_accounts pa ON mp.account_id = pa.id
      WHERE mp.organization_id = $1
      ${accountId ? "AND mp.account_id = $3" : ""}
      ORDER BY mp.purchased_at DESC
      LIMIT $2
    `;

    const params = accountId
      ? [organizationId, limit, accountId]
      : [organizationId, limit];
    const res = await client.query(q, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      accountId: r.account_id ? Number(r.account_id) : null,
      points: Number(r.points || 0),
      valueCents: Number(r.value_cents || 0),
      costPerThousandCents: Number(r.cost_per_thousand_cents || 0),
      date: r.purchased_at,
      status: r.status,
      description: r.description,
      program: r.program_name || null,
      account: r.account_nickname || null,
    }));
  } catch (err: any) {
    if (isMissingRelationError(err)) return [];
    throw err;
  } finally {
    client.release();
  }
}

const purchasesApi = { getPurchasesOverview };
export default purchasesApi;
