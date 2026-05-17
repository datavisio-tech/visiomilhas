import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getSalesOverview(
  orgSlug = "demo-visiomilhas",
  limit = 50,
) {
  const admClient = await admPool().connect();
  try {
    const orgRes = await admClient.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [orgSlug],
    );
    if (!orgRes.rows.length) return [];
    const orgId = orgRes.rows[0].id;

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

      const res = await client.query(q, [orgId, limit]);
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
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (isMissingRelationError(err)) return [];
    throw err;
  } finally {
    admClient.release();
  }
}

const salesApi = { getSalesOverview };
export default salesApi;
