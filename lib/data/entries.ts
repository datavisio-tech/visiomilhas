import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "./db-errors";
import { resolveReadScope } from "../server/read-scope";
import { type SessionContext } from "../server/auth-context";

export async function getEntriesOverview(
  sessionContext?: SessionContext | null,
  limit = 50,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const q = `
      SELECT me.id, me.type, me.description, me.points, me.occurred_at::text as occurred_at, me.direction, me.status,
             lp.name as program_name, pa.nickname as account_nickname
      FROM mile_entries me
      LEFT JOIN loyalty_programs lp ON me.program_id = lp.id
      LEFT JOIN program_accounts pa ON me.account_id = pa.id
      WHERE me.organization_id = $1
      ORDER BY me.occurred_at DESC
      LIMIT $2
    `;

    const res = await client.query(q, [organizationId, limit]);
    return res.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      points: Number(r.points || 0),
      date: r.occurred_at,
      direction: r.direction,
      status: r.status,
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
