import { appPool } from "../../db/app/client";
import { isMissingRelationError } from "../data/db-errors";
import { resolveReadScope } from "./read-scope";
import { type SessionContext } from "./auth-context";

type Metrics = {
  totalBalance: number;
  avgCpmCents: number;
  pointsToReceive: number;
};

export type RevenueTrendPoint = {
  name: string;
  revenueCents: number;
  profitCents: number;
};

export type RevenueSnapshot = {
  totalRevenueCents: number;
  totalProfitCents: number;
  trendLabel: string;
  points: RevenueTrendPoint[];
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

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  })
    .format(value)
    .replace(".", "")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatTrendLabel(previousProfit: number, currentProfit: number) {
  if (previousProfit === 0) {
    if (currentProfit === 0) return "Sem tendência";
    return "Sem base anterior";
  }

  const delta = ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100;
  const rounded = delta.toFixed(1);
  return `${delta >= 0 ? "+" : ""}${rounded}%`;
}

export async function getRevenueSnapshot(
  sessionContext?: SessionContext | null,
  months = 6,
): Promise<RevenueSnapshot> {
  const { organizationId } = await resolveReadScope(sessionContext);

  const pool = appPool();
  const client = await pool.connect();
  try {
    const summaryRes = await client.query(
      `
      SELECT
        COALESCE(SUM(revenue_cents)::bigint, 0) AS revenue_total,
        COALESCE(SUM(profit_cents)::bigint, 0) AS profit_total
      FROM mile_sales
      WHERE organization_id = $1
        AND status = 'completed'
    `,
      [organizationId],
    );

    const trendRes = await client.query(
      `
      SELECT
        date_trunc('month', sold_at) AS month_bucket,
        COALESCE(SUM(revenue_cents)::bigint, 0) AS revenue_total,
        COALESCE(SUM(profit_cents)::bigint, 0) AS profit_total
      FROM mile_sales
      WHERE organization_id = $1
        AND status = 'completed'
        AND sold_at IS NOT NULL
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT $2
    `,
      [organizationId, months],
    );

    const points = trendRes.rows
      .slice()
      .reverse()
      .map((row: any) => {
        const month = new Date(row.month_bucket);
        return {
          name: formatMonthLabel(month),
          revenueCents: Number(row.revenue_total || 0),
          profitCents: Number(row.profit_total || 0),
        };
      });

    const latest = points[points.length - 1];
    const previous = points[points.length - 2];

    return {
      totalRevenueCents: Number(summaryRes.rows[0]?.revenue_total || 0),
      totalProfitCents: Number(summaryRes.rows[0]?.profit_total || 0),
      trendLabel: latest && previous
        ? formatTrendLabel(previous.profitCents, latest.profitCents)
        : "Sem tendência",
      points,
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
