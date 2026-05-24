import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "../data/db-errors";
import { resolveReadScope } from "./read-scope";
import { type SessionContext } from "./auth-context";

type Metrics = {
  totalBalance: number;
  avgCpmCents: number;
  pointsToReceive: number;
};

export async function getMetrics(
  sessionContext?: SessionContext | null,
): Promise<Metrics> {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(current_points_balance)::bigint,0) as total FROM program_accounts WHERE organization_id = $1`,
      [organizationId],
    );
    const avgRes = await client.query(
      `SELECT COALESCE(AVG(current_avg_cost_per_thousand_cents)::int,0) as avg FROM program_accounts WHERE organization_id = $1`,
      [organizationId],
    );
    const pendingRes = await client.query(
      `SELECT COALESCE(SUM(points)::bigint,0) as pending FROM mile_entries WHERE organization_id = $1 AND status != 'posted'`,
      [organizationId],
    );

    return {
      totalBalance: Number(totalRes.rows[0].total || 0),
      avgCpmCents: Number(avgRes.rows[0].avg || 0),
      pointsToReceive: Number(pendingRes.rows[0].pending || 0),
    };
  } finally {
    client.release();
  }
}

export async function getRecentEntries(sessionContext?: SessionContext | null) {
  const { organizationId } = await resolveReadScope(sessionContext);
  const pool = appPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT me.id, me.points, me.description, me.occurred_at::text as occurred_at, me.status FROM mile_entries me WHERE me.organization_id = $1 ORDER BY me.occurred_at DESC LIMIT 5`,
      [organizationId],
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      points: Number(r.points),
      description: r.description,
      date: r.occurred_at,
      status: r.status,
    }));
  } catch (err: any) {
    if (isMissingRelationError(err)) {
      return [];
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function getRecentPurchases(
  sessionContext?: SessionContext | null,
) {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, points, amount_cents, status FROM mile_purchases WHERE organization_id = $1 ORDER BY purchased_at DESC LIMIT 5`,
      [organizationId],
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      points: Number(r.points),
      valueCents: Number(r.amount_cents),
      status: r.status,
    }));
  } catch (err: any) {
    if (isMissingRelationError(err)) {
      return [];
    }
    throw err;
  } finally {
    client.release();
  }
}

const dashboardApi = { getMetrics, getRecentEntries, getRecentPurchases };

export default dashboardApi;
