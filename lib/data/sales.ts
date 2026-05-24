import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "./db-errors";
import { resolveReadScope } from "../server/read-scope";
import { type SessionContext } from "../server/auth-context";

export async function getSalesOverview(
  sessionContext?: SessionContext | null,
  limit = 50,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const q = `
      SELECT ms.id, ms.points, ms.revenue_cents, ms.profit_cents, ms.sold_at::text as sold_at, ms.status, ms.description,
             lp.name as program_name, pa.nickname as account_nickname
      FROM mile_sales ms
      LEFT JOIN loyalty_programs lp ON ms.program_id = lp.id
      LEFT JOIN program_accounts pa ON ms.account_id = pa.id
      WHERE ms.organization_id = $1
      ORDER BY ms.sold_at DESC
      LIMIT $2
    `;

    const res = await client.query(q, [organizationId, limit]);
    return res.rows.map((r: any) => ({
      id: r.id,
      points: Number(r.points || 0),
      revenueCents: Number(r.revenue_cents || 0),
      profitCents: Number(r.profit_cents || 0),
      date: r.sold_at,
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

const salesApi = { getSalesOverview };
export default salesApi;
