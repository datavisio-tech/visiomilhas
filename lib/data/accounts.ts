import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getAccountsOverview(orgSlug = "demo-visiomilhas") {
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
      const res = await client.query(
        `SELECT pa.id, pa.nickname, pa.current_points_balance, pa.current_avg_cost_per_thousand_cents, lp.name as program_name FROM program_accounts pa LEFT JOIN loyalty_programs lp ON pa.program_id = lp.id WHERE pa.organization_id = $1 ORDER BY pa.id LIMIT 100`,
        [orgId],
      );

      return res.rows.map((r: any) => ({
        id: r.id,
        nickname: r.nickname,
        balance: Number(r.current_points_balance || 0),
        cpmCents: Number(r.current_avg_cost_per_thousand_cents || 0),
        program: r.program_name || null,
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

const accountsApi = { getAccountsOverview };
export default accountsApi;
