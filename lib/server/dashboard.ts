import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "../data/db-errors";

type Metrics = {
  totalBalance: number;
  avgCpmCents: number;
  pointsToReceive: number;
};

export async function getMetrics(
  orgSlug = "demo-visiomilhas",
): Promise<Metrics> {
  // Resolve organization id from ADM database, then query APP database for metrics
  const admClient = await admPool().connect();
  let orgId: any = null;
  try {
    const orgRes = await admClient.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [orgSlug],
    );
    if (!orgRes.rows.length)
      return { totalBalance: 0, avgCpmCents: 0, pointsToReceive: 0 };
    orgId = orgRes.rows[0].id;
  } catch (err: any) {
    if (isMissingRelationError(err)) {
      return { totalBalance: 0, avgCpmCents: 0, pointsToReceive: 0 };
    }
    throw err;
  } finally {
    admClient.release();
  }

  const pool = appPool();
  const client = await pool.connect();
  try {
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(current_points_balance)::bigint,0) as total FROM program_accounts WHERE organization_id = $1`,
      [orgId],
    );
    const avgRes = await client.query(
      `SELECT COALESCE(AVG(current_avg_cost_per_thousand_cents)::int,0) as avg FROM program_accounts WHERE organization_id = $1`,
      [orgId],
    );
    const pendingRes = await client.query(
      `SELECT COALESCE(SUM(points)::bigint,0) as pending FROM mile_entries WHERE organization_id = $1 AND status != 'posted'`,
      [orgId],
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

export async function getRecentEntries(orgSlug = "demo-visiomilhas") {
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
        `SELECT me.id, me.points, me.description, me.occurred_at::text as occurred_at, me.status FROM mile_entries me WHERE me.organization_id = $1 ORDER BY me.occurred_at DESC LIMIT 5`,
        [orgId],
      );
      return res.rows.map((r: any) => ({
        id: r.id,
        points: Number(r.points),
        description: r.description,
        date: r.occurred_at,
        status: r.status,
      }));
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (isMissingRelationError(err)) {
      return [];
    }
    throw err;
  } finally {
    admClient.release();
  }
}

export async function getRecentPurchases(orgSlug = "demo-visiomilhas") {
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
        `SELECT id, points, amount_cents, status FROM mile_purchases WHERE organization_id = $1 ORDER BY purchased_at DESC LIMIT 5`,
        [orgId],
      );
      return res.rows.map((r: any) => ({
        id: r.id,
        points: Number(r.points),
        valueCents: Number(r.amount_cents),
        status: r.status,
      }));
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (isMissingRelationError(err)) {
      return [];
    }
    throw err;
  } finally {
    admClient.release();
  }
}

const dashboardApi = { getMetrics, getRecentEntries, getRecentPurchases };

export default dashboardApi;
