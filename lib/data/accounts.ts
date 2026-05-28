import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "./db-errors";
import { resolveReadScope } from "../server/read-scope";
import { type SessionContext } from "../server/auth-context";
import { buildAccountDisplayName } from "../accounts";

export type AccountOverview = {
  id: number;
  programId: number;
  program: string | null;
  programSlug: string | null;
  programColor: string | null;
  nickname: string | null;
  displayName: string;
  holderName: string | null;
  status: string;
  isActive: boolean;
  balance: number;
  cpmCents: number;
};

export type AccountProgramOption = {
  id: number;
  name: string;
  slug: string | null;
  color: string | null;
  isActive: boolean;
};

export async function getAccountsOverview(
  sessionContext?: SessionContext | null,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT
        pa.id,
        pa.program_id,
        pa.nickname,
        pa.holder_name,
        pa.status,
        pa.current_points_balance,
        pa.current_avg_cost_per_thousand_cents,
        lp.name as program_name,
        lp.slug as program_slug,
        lp.color as program_color
      FROM program_accounts pa
      LEFT JOIN loyalty_programs lp ON pa.program_id = lp.id
      WHERE pa.organization_id = $1
      ORDER BY pa.status DESC, lp.name NULLS LAST, pa.nickname NULLS LAST, pa.id DESC
      LIMIT 100`,
      [organizationId],
    );

    return res.rows.map((r: any) => ({
      id: Number(r.id),
      programId: Number(r.program_id),
      nickname: r.nickname ?? null,
      holderName: r.holder_name ?? null,
      status: String(r.status || "inactive"),
      isActive: String(r.status || "inactive") === "active",
      balance: Number(r.current_points_balance || 0),
      cpmCents: Number(r.current_avg_cost_per_thousand_cents || 0),
      program: r.program_name || null,
      programSlug: r.program_slug || null,
      programColor: r.program_color || null,
      displayName: buildAccountDisplayName(r.program_name || null, r.nickname),
    }));
  } catch (err: any) {
    if (isMissingRelationError(err)) return [];
    throw err;
  } finally {
    client.release();
  }
}

export async function getAccountProgramsOverview(
  sessionContext?: SessionContext | null,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, name, slug, color, is_active FROM loyalty_programs WHERE organization_id = $1 ORDER BY name ASC`,
      [organizationId],
    );

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name as string,
      slug: row.slug ?? null,
      color: row.color ?? null,
      isActive: Boolean(row.is_active),
    })) satisfies AccountProgramOption[];
  } catch (err: any) {
    if (isMissingRelationError(err)) return [];
    throw err;
  } finally {
    client.release();
  }
}

export async function getAccountsCenterOverview(
  sessionContext?: SessionContext | null,
) {
  const [accounts, programs] = await Promise.all([
    getAccountsOverview(sessionContext),
    getAccountProgramsOverview(sessionContext),
  ]);

  return { accounts, programs };
}

const accountsApi = { getAccountsOverview };
export default accountsApi;
