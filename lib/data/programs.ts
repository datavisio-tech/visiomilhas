import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { type SessionContext } from "../server/auth-context";
import { resolveReadScope } from "../server/read-scope";
import {
  getAccountsOverview,
  getAccountProgramsOverview,
  type AccountOverview,
  type AccountProgramOption,
} from "./accounts";
import { getPurchasesOverview } from "./purchases";
import { getSalesOverview } from "./sales";
import { getTransfersOverview } from "./transfers";
import { isMissingRelationError } from "./db-errors";

export type AccountOperationalMetric = {
  balance: number;
  cpmCents: number;
  resultOperationalCents: number;
  pointsReceivable: number;
  financialValueCents: number;
  lastMovementAt: string | null;
};

export type AccountOperationalChartPoint = {
  label: string;
  balance: number;
  credits: number;
  debits: number;
  cpmCents: number;
  resultCents: number;
};

export type ProgramsCockpitPeriod = "30d" | "90d" | "12m";

export type AccountOperationalStatementItem = {
  id: string;
  kind: "purchase" | "sale" | "transfer" | "subscription" | "adjustment";
  operationLabel: string;
  origin: string;
  title: string;
  description: string;
  date: string | null;
  points: number;
  financialValueCents: number;
  cpmCents: number;
  balanceAfterPoints: number;
  status: string;
  tone: "neutral" | "success" | "warning";
};

export type AccountOperationalTimelineItem = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  tone: "neutral" | "success" | "warning";
};

export type AccountOperationalSubscription = {
  id: number;
  status: string;
  planName: string | null;
  planCode: string | null;
  trialEndsAt: string | null;
  updatedAt: string | null;
};

export type AccountOperationalView = {
  accounts: AccountOverview[];
  programs: AccountProgramOption[];
  account: AccountOverview | null;
  metrics: AccountOperationalMetric;
  charts: {
    balanceSeries: AccountOperationalChartPoint[];
    flowSeries: AccountOperationalChartPoint[];
    periods: Record<ProgramsCockpitPeriod, AccountOperationalChartPoint[]>;
  };
  statement: AccountOperationalStatementItem[];
  timeline: AccountOperationalTimelineItem[];
  pendingPurchases: Array<{
    id: number;
    description: string | null;
    points: number;
    valueCents: number;
    status: string;
    date: string | null;
  }>;
  subscriptions: AccountOperationalSubscription[];
  transfers: Array<{
    id: number;
    description: string | null;
    pointsSent: number;
    pointsReceived: number;
    status: string;
    date: string | null;
  }>;
};

export type ProgramOperationalSummary = {
  accounts: AccountOverview[];
  programs: AccountProgramOption[];
  selectedAccount: AccountOverview | null;
  totalBalance: number;
  activeAccounts: number;
  inactiveAccounts: number;
  accountsByProgram: Array<{
    programId: number;
    programName: string;
    programSlug: string | null;
    programColor: string | null;
    accountCount: number;
    balance: number;
  }>;
};

export async function getProgramsOverview(orgSlug = "demo-visiomilhas") {
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
        `SELECT id, name, slug, type, country, currency_label, is_active FROM loyalty_programs WHERE organization_id = $1 ORDER BY name`,
        [orgId],
      );

      return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        type: r.type,
        country: r.country,
        currencyLabel: r.currency_label,
        isActive: r.is_active,
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

function normalizeLabelDate(value: string | null | undefined) {
  if (!value) return "Sem data";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem data";
  return parsed.toLocaleDateString("pt-BR", { month: "short", day: "2-digit" });
}

function toIsoDay(value: string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

type OperationalEvent = {
  id: string;
  kind: "purchase" | "sale" | "transfer" | "subscription" | "adjustment";
  date: string | null;
  deltaPoints: number;
  credits: number;
  debits: number;
  points: number;
  valueCents: number;
  revenueCents: number;
  profitCents: number;
  feeCents: number;
  title: string;
  description: string;
  tone: "neutral" | "success" | "warning";
  status: string;
};

function buildChartSeries(
  events: OperationalEvent[],
  selectedAccount: AccountOverview,
  balanceBaseline: number,
  windowDays: number,
) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const relevant = [...events]
    .filter((event) => {
      if (!event.date) return false;
      const timestamp = new Date(event.date).getTime();
      return !Number.isNaN(timestamp) && timestamp >= cutoff;
    })
    .sort((left, right) => {
      const leftDate = new Date(left.date ?? 0).getTime();
      const rightDate = new Date(right.date ?? 0).getTime();
      return leftDate - rightDate;
    });

  const totalDelta = relevant.reduce(
    (sum, event) => sum + event.deltaPoints,
    0,
  );
  let runningBalance = balanceBaseline - totalDelta;
  let purchasePoints = 0;
  let purchaseValueCents = 0;
  let revenueCents = 0;
  let profitCents = 0;
  let transferFeeCents = 0;

  const grouped = new Map<
    string,
    {
      label: string;
      balance: number;
      credits: number;
      debits: number;
      cpmCents: number;
      resultCents: number;
    }
  >();

  for (const event of relevant) {
    runningBalance += event.deltaPoints;

    if (event.kind === "purchase") {
      purchasePoints += event.points;
      purchaseValueCents += event.valueCents;
    }
    if (event.kind === "sale") {
      revenueCents += event.revenueCents;
      profitCents += event.profitCents;
    }
    if (event.kind === "transfer") {
      transferFeeCents += event.feeCents;
    }

    const day = toIsoDay(event.date);
    if (!day) continue;

    const existing = grouped.get(day) ?? {
      label: normalizeLabelDate(event.date),
      balance: runningBalance,
      credits: 0,
      debits: 0,
      cpmCents: selectedAccount.cpmCents,
      resultCents: 0,
    };

    existing.balance = runningBalance;
    existing.credits += event.credits;
    existing.debits += event.debits;
    existing.cpmCents = purchasePoints
      ? Math.round((purchaseValueCents / purchasePoints) * 1000)
      : selectedAccount.cpmCents;
    existing.resultCents =
      revenueCents - purchaseValueCents - transferFeeCents + profitCents;
    grouped.set(day, existing);
  }

  return [...grouped.values()];
}

function buildStatement(
  events: OperationalEvent[],
  selectedAccount: AccountOverview,
) {
  const ordered = [...events].sort((left, right) => {
    const leftDate = new Date(left.date ?? 0).getTime();
    const rightDate = new Date(right.date ?? 0).getTime();
    return leftDate - rightDate;
  });

  const totalDelta = ordered.reduce((sum, event) => sum + event.deltaPoints, 0);
  let runningBalance = selectedAccount.balance - totalDelta;

  return ordered
    .map((event) => {
      runningBalance += event.deltaPoints;
      const operationLabel =
        event.kind === "purchase"
          ? "Compra"
          : event.kind === "sale"
            ? "Venda"
            : event.kind === "subscription"
              ? "Assinatura"
              : event.kind === "adjustment"
                ? "Ajuste"
                : "Transferência";
      return {
        id: event.id,
        kind: event.kind,
        operationLabel,
        origin:
          event.kind === "transfer"
            ? event.title
            : event.kind === "subscription"
              ? "Plano / Assinatura"
              : (selectedAccount.program ?? selectedAccount.displayName),
        title: event.title,
        description: event.description,
        date: event.date,
        points: event.points,
        financialValueCents:
          event.kind === "sale"
            ? event.revenueCents
            : event.kind === "purchase"
              ? event.valueCents
              : event.feeCents,
        cpmCents:
          event.kind === "purchase"
            ? event.points
              ? Math.round((event.valueCents / event.points) * 1000)
              : selectedAccount.cpmCents
            : selectedAccount.cpmCents,
        balanceAfterPoints: runningBalance,
        status: event.status,
        tone: event.tone,
      } satisfies AccountOperationalStatementItem;
    })
    .reverse();
}

function isPendingStatus(value?: string | null): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    normalized.includes("pend") ||
    normalized.includes("open") ||
    normalized.includes("await") ||
    normalized.includes("processing") ||
    normalized.includes("analysis")
  );
}

async function getLatestSubscriptionOverview(organizationId: number) {
  const client = await admPool().connect();

  try {
    const result = await client.query(
      `SELECT s.id, s.status, s.trial_ends_at, s.updated_at, p.name as plan_name, p.code as plan_code
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.organization_id = $1
       ORDER BY s.updated_at DESC, s.id DESC
       LIMIT 1`,
      [organizationId],
    );

    return result.rows[0]
      ? ({
          id: Number(result.rows[0].id),
          status: String(result.rows[0].status ?? "unknown"),
          planName: result.rows[0].plan_name ?? null,
          planCode: result.rows[0].plan_code ?? null,
          trialEndsAt: result.rows[0].trial_ends_at
            ? new Date(result.rows[0].trial_ends_at).toISOString()
            : null,
          updatedAt: result.rows[0].updated_at
            ? new Date(result.rows[0].updated_at).toISOString()
            : null,
        } satisfies AccountOperationalSubscription)
      : null;
  } catch (error) {
    if (isMissingRelationError(error)) {
      return null;
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getAccountOperationalView(
  sessionContext?: SessionContext | null,
  accountId?: number | null,
): Promise<AccountOperationalView> {
  const { organizationId } = await resolveReadScope(sessionContext);

  const [accounts, programs] = await Promise.all([
    getAccountsOverview(sessionContext),
    getAccountProgramsOverview(sessionContext),
  ]);

  const selectedAccount =
    accounts.find((account) => account.id === accountId) ??
    accounts.find((account) => account.isActive) ??
    accounts[0] ??
    null;

  if (!selectedAccount) {
    return {
      accounts,
      programs,
      account: null,
      metrics: {
        balance: 0,
        cpmCents: 0,
        resultOperationalCents: 0,
        pointsReceivable: 0,
        financialValueCents: 0,
        lastMovementAt: null,
      },
      charts: {
        balanceSeries: [],
        flowSeries: [],
        periods: { "30d": [], "90d": [], "12m": [] },
      },
      statement: [],
      timeline: [],
      pendingPurchases: [],
      subscriptions: [],
      transfers: [],
    };
  }

  const [purchases, sales, transfers, subscription] = await Promise.all([
    getPurchasesOverview(sessionContext, 50, selectedAccount.id),
    getSalesOverview(sessionContext, 50, selectedAccount.id),
    getTransfersOverview(sessionContext, 50, selectedAccount.id),
    getLatestSubscriptionOverview(organizationId),
  ]);

  const pendingPurchases = purchases.filter((purchase) =>
    isPendingStatus(purchase.status),
  );
  const pendingTransfers = transfers.filter((transfer) =>
    isPendingStatus(transfer.status),
  );
  const totalPurchaseCents = purchases.reduce(
    (sum, purchase) => sum + (purchase.valueCents || 0),
    0,
  );
  const totalRevenueCents = sales.reduce(
    (sum, sale) => sum + (sale.revenueCents || 0),
    0,
  );
  const totalProfitCents = sales.reduce(
    (sum, sale) => sum + (sale.profitCents || 0),
    0,
  );
  const totalTransferFeeCents = transfers.reduce(
    (sum, transfer) => sum + (transfer.feeCents || 0),
    0,
  );
  const pointsReceivable = pendingPurchases.reduce(
    (sum, purchase) => sum + (purchase.points || 0),
    0,
  );
  const financialValueCents = Math.round(
    (selectedAccount.balance * selectedAccount.cpmCents) / 1000,
  );

  const events: OperationalEvent[] = [
    ...purchases.map(
      (purchase) =>
        ({
          id: `purchase-${purchase.id}`,
          kind: "purchase" as const,
          date: purchase.date,
          deltaPoints: purchase.points,
          credits: purchase.points,
          debits: 0,
          points: purchase.points,
          valueCents: purchase.valueCents || 0,
          revenueCents: 0,
          profitCents: 0,
          feeCents: 0,
          title: `Compra${purchase.status ? ` ${purchase.status}` : ""}`,
          description:
            purchase.description ?? purchase.account ?? "Movimento de compra",
          tone: isPendingStatus(purchase.status) ? "warning" : "success",
          status: purchase.status,
        }) satisfies OperationalEvent,
    ),
    ...sales.map(
      (sale) =>
        ({
          id: `sale-${sale.id}`,
          kind: "sale" as const,
          date: sale.date,
          deltaPoints: -sale.points,
          credits: 0,
          debits: sale.points,
          points: sale.points,
          valueCents: 0,
          revenueCents: sale.revenueCents || 0,
          profitCents: sale.profitCents || 0,
          feeCents: 0,
          title: `Venda${sale.status ? ` ${sale.status}` : ""}`,
          description: sale.description ?? sale.account ?? "Movimento de venda",
          tone: "neutral" as const,
          status: sale.status,
        }) satisfies OperationalEvent,
    ),
    ...transfers.map(
      (transfer) =>
        ({
          id: `transfer-${transfer.id}`,
          kind: "transfer" as const,
          date: transfer.date,
          deltaPoints:
            transfer.fromAccountId === selectedAccount.id
              ? -transfer.pointsSent
              : transfer.pointsReceived,
          credits:
            transfer.fromAccountId === selectedAccount.id
              ? 0
              : transfer.pointsReceived,
          debits:
            transfer.fromAccountId === selectedAccount.id
              ? transfer.pointsSent
              : 0,
          points:
            transfer.fromAccountId === selectedAccount.id
              ? transfer.pointsSent
              : transfer.pointsReceived,
          valueCents: 0,
          revenueCents: 0,
          profitCents: 0,
          feeCents: transfer.feeCents || 0,
          title: `Transferência${transfer.status ? ` ${transfer.status}` : ""}`,
          description: transfer.description ?? "Movimento de transferência",
          tone: isPendingStatus(transfer.status) ? "warning" : "neutral",
          status: transfer.status,
        }) satisfies OperationalEvent,
    ),
  ]
    .filter((event) => event.date)
    .sort(
      (left, right) =>
        new Date(right.date ?? 0).getTime() -
        new Date(left.date ?? 0).getTime(),
    );

  const grouped = new Map<string, AccountOperationalChartPoint>();
  let runningBalance = selectedAccount.balance;

  for (const event of [...events].reverse()) {
    const key = String(event.date).slice(0, 10);
    const label = normalizeLabelDate(event.date);
    const existing = grouped.get(key) ?? {
      label,
      balance: runningBalance,
      credits: 0,
      debits: 0,
      cpmCents: selectedAccount.cpmCents,
      resultCents: 0,
    };
    runningBalance += event.deltaPoints;
    existing.balance = runningBalance;
    existing.credits += event.credits;
    existing.debits += event.debits;
    grouped.set(key, existing);
  }

  const balanceSeries = [...grouped.values()].slice(-8);
  const flowSeries = [...grouped.values()].slice(-8);
  const periods = {
    "30d": buildChartSeries(
      events,
      selectedAccount,
      selectedAccount.balance,
      30,
    ),
    "90d": buildChartSeries(
      events,
      selectedAccount,
      selectedAccount.balance,
      90,
    ),
    "12m": buildChartSeries(
      events,
      selectedAccount,
      selectedAccount.balance,
      365,
    ),
  } satisfies Record<ProgramsCockpitPeriod, AccountOperationalChartPoint[]>;

  const statement = buildStatement(events, selectedAccount);

  const timeline: AccountOperationalTimelineItem[] = statement
    .slice(0, 10)
    .map((event, index) => ({
      id: `${selectedAccount.id}-${index}`,
      title: event.title,
      description: event.description,
      date: event.date ?? null,
      tone: event.tone,
    }));

  const lastMovementAt = timeline[0]?.date ?? selectedAccount.updatedAt ?? null;

  return {
    accounts,
    programs,
    account: selectedAccount,
    metrics: {
      balance: selectedAccount.balance,
      cpmCents: selectedAccount.cpmCents,
      resultOperationalCents:
        totalRevenueCents -
        totalPurchaseCents -
        totalTransferFeeCents +
        totalProfitCents,
      pointsReceivable,
      financialValueCents,
      lastMovementAt,
    },
    charts: {
      balanceSeries,
      flowSeries,
      periods,
    },
    statement,
    timeline,
    pendingPurchases: pendingPurchases.slice(0, 4).map((purchase) => ({
      id: purchase.id,
      description: purchase.description,
      points: purchase.points,
      valueCents: purchase.valueCents,
      status: purchase.status,
      date: purchase.date,
    })),
    subscriptions: subscription ? [subscription] : [],
    transfers: pendingTransfers.slice(0, 4).map((transfer) => ({
      id: transfer.id,
      description: transfer.description,
      pointsSent: transfer.pointsSent,
      pointsReceived: transfer.pointsReceived,
      status: transfer.status,
      date: transfer.date,
    })),
  };
}

export async function getProgramOperationalSummary(
  sessionContext?: SessionContext | null,
): Promise<ProgramOperationalSummary> {
  const [accounts, programs] = await Promise.all([
    getAccountsOverview(sessionContext),
    getAccountProgramsOverview(sessionContext),
  ]);

  const selectedAccount =
    accounts.find((account) => account.isActive) ?? accounts[0] ?? null;
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0,
  );
  const activeAccounts = accounts.filter((account) => account.isActive).length;
  const inactiveAccounts = Math.max(accounts.length - activeAccounts, 0);

  const accountsByProgramMap = new Map<
    number,
    {
      programId: number;
      programName: string;
      programSlug: string | null;
      programColor: string | null;
      accountCount: number;
      balance: number;
    }
  >();

  for (const account of accounts) {
    const programId = account.programId;
    const existing = accountsByProgramMap.get(programId) ?? {
      programId,
      programName: account.program ?? "Programa sem nome",
      programSlug: account.programSlug,
      programColor: account.programColor,
      accountCount: 0,
      balance: 0,
    };

    existing.accountCount += 1;
    existing.balance += account.balance || 0;
    accountsByProgramMap.set(programId, existing);
  }

  return {
    accounts,
    programs,
    selectedAccount,
    totalBalance,
    activeAccounts,
    inactiveAccounts,
    accountsByProgram: [...accountsByProgramMap.values()].sort((left, right) =>
      left.programName.localeCompare(right.programName),
    ),
  };
}

const programsApi = { getProgramsOverview };

export default programsApi;
