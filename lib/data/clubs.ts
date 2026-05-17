import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getClubsOverview(
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
      SELECT mc.id, mc.name, mc.monthly_amount_cents, mc.base_monthly_points, mc.bonus_monthly_points, mc.started_at::text as started_at, mc.ended_at::text as ended_at, mc.status,
             lp.name as program_name, pa.nickname as account_nickname, mc.notes
      FROM mile_clubs mc
      LEFT JOIN loyalty_programs lp ON mc.program_id = lp.id
      LEFT JOIN program_accounts pa ON mc.account_id = pa.id
      WHERE mc.organization_id = $1
      ORDER BY mc.started_at DESC NULLS LAST
      LIMIT $2
    `;

      const res = await client.query(q, [orgId, limit]);
      return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        program: r.program_name || null,
        account: r.account_nickname || null,
        monthlyAmountCents: Number(r.monthly_amount_cents || 0),
        baseMonthlyPoints: Number(r.base_monthly_points || 0),
        bonusMonthlyPoints: Number(r.bonus_monthly_points || 0),
        startedAt: r.started_at || null,
        endedAt: r.ended_at || null,
        status: r.status,
        notes: r.notes || null,
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

const clubsApi = { getClubsOverview };
export default clubsApi;
