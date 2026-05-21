import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getTransfersOverview(
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
      SELECT mt.id, mt.points_sent, mt.points_received, mt.bonus_percentage, mt.transfer_fee_cents, mt.transferred_at::text as transferred_at, mt.status, mt.description,
             fpl.name as from_program_name, fpa.nickname as from_account_nickname,
             tpl.name as to_program_name, tpa.nickname as to_account_nickname
      FROM mile_transfers mt
      LEFT JOIN loyalty_programs fpl ON mt.from_program_id = fpl.id
      LEFT JOIN program_accounts fpa ON mt.from_account_id = fpa.id
      LEFT JOIN loyalty_programs tpl ON mt.to_program_id = tpl.id
      LEFT JOIN program_accounts tpa ON mt.to_account_id = tpa.id
      WHERE mt.organization_id = $1
      ORDER BY mt.transferred_at DESC
      LIMIT $2
    `;

      const res = await client.query(q, [orgId, limit]);
      return res.rows.map((r: any) => ({
        id: r.id,
        pointsSent: Number(r.points_sent || 0),
        pointsReceived: Number(r.points_received || 0),
        bonusPercent: Number(r.bonus_percentage || 0),
        feeCents: Number(r.transfer_fee_cents || 0),
        date: r.transferred_at,
        status: r.status,
        description: r.description,
        fromProgram: r.from_program_name || null,
        fromAccount: r.from_account_nickname || null,
        toProgram: r.to_program_name || null,
        toAccount: r.to_account_nickname || null,
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

const transfersApi = { getTransfersOverview };
export default transfersApi;
