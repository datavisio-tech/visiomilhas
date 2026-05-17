import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getPurchasesOverview(
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
      SELECT mp.id, mp.points, COALESCE(mp.total_cost_cents, mp.amount_cents) as value_cents, mp.cost_per_thousand_cents, mp.purchased_at::text as purchased_at, mp.status, mp.description,
             lp.name as program_name, pa.nickname as account_nickname
      FROM mile_purchases mp
      LEFT JOIN loyalty_programs lp ON mp.program_id = lp.id
      LEFT JOIN program_accounts pa ON mp.account_id = pa.id
      WHERE mp.organization_id = $1
      ORDER BY mp.purchased_at DESC
      LIMIT $2
    `;

      const res = await client.query(q, [orgId, limit]);
      return res.rows.map((r: any) => ({
        id: r.id,
        points: Number(r.points || 0),
        valueCents: Number(r.value_cents || 0),
        costPerThousandCents: Number(r.cost_per_thousand_cents || 0),
        date: r.purchased_at,
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

const purchasesApi = { getPurchasesOverview };
export default purchasesApi;
