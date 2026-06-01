/* eslint-disable no-unused-vars */
type QueryRunner = {
  query: (_sql: string, _params?: any[]) => Promise<{ rows: any[] }>;
};

export type FinancialIntegrityIssueCode =
  | "NEGATIVE_BALANCE_DETECTED"
  | "ORPHAN_LOT_DETECTED"
  | "FIFO_DIVERGENCE_DETECTED"
  | "INVALID_CONSUMPTION_DETECTED"
  | "DELTA_INCONSISTENT_DETECTED"
  | "BALANCE_ABOVE_ALLOWED_DETECTED"
  | "ACCOUNT_ORPHAN_DETECTED"
  | "OWNERSHIP_INCONSISTENT_DETECTED";

export type FinancialEventCode =
  | "BALANCE_RECONCILIATION_SUCCESS"
  | "BALANCE_RECONCILIATION_WARNING"
  | "NEGATIVE_BALANCE_DETECTED"
  | "ORPHAN_LOT_DETECTED"
  | "FIFO_RUNTIME_RECOVERY"
  | "DUPLICATE_OPERATION_BLOCKED"
  | "FINANCIAL_REPLAY_EXECUTED"
  | "FIFO_LINEAGE_VALIDATED"
  | "LEDGER_AUDIT_WARNING"
  | "BALANCE_DRIFT_DETECTED"
  | "AUTOMATIC_RECONCILIATION_TRIGGERED"
  | "FINANCIAL_INTEGRITY_REPORT_CREATED"
  | "FINANCIAL_TIMELINE_BUILT"
  | "FIFO_LINEAGE_BUILT"
  | "ACCOUNT_INTEGRITY_REPORT_CREATED"
  | "FIFO_INTEGRITY_WARNING"
  | "LEDGER_REPLAY_VALIDATED"
  | "FINANCIAL_DRIFT_DETECTED"
  | "ACCOUNT_INTEGRITY_SUMMARY_CREATED"
  | "FIFO_INTEGRITY_SUMMARY_CREATED"
  | "LEDGER_INTEGRITY_SUMMARY_CREATED"
  | "FINANCIAL_ACCOUNT_INSPECTED"
  | "FIFO_CONSUMPTION_INSPECTED"
  | "FINANCIAL_WARNING_DETECTED"
  | "FINANCIAL_LEGACY_SCHEMA_DETECTED"
  | "FINANCIAL_RECOVERY_EXECUTED";

export type FinancialIntegrityIssue = {
  code: FinancialIntegrityIssueCode;
  accountId?: number | null;
  lotId?: number | null;
};

export type FinancialIntegrityResult = {
  organizationId: number;
  accountId?: number | null;
  checkedAccounts: number;
  issues: FinancialIntegrityIssue[];
  isConsistent: boolean;
};

export type AccountIntegrityReport = {
  organizationId: number;
  accountId?: number | null;
  accountExists: boolean;
  ownershipConsistent: boolean;
  balanceConsistent: boolean;
  balanceNegative: boolean;
  orphanAccount: boolean;
  driftDetected: boolean;
  issues: FinancialIntegrityIssue[];
};

export type FifoIntegrityReport = {
  organizationId: number;
  accountId?: number | null;
  lineageBroken: boolean;
  orphanLots: number;
  invalidRemainingPoints: boolean;
  consumptionImpossible: boolean;
  issues: FinancialIntegrityIssue[];
};

export type LedgerIntegrityReport = {
  organizationId: number;
  accountId?: number | null;
  replayConsistent: boolean;
  ledgerConsistent: boolean;
  deltaImpossible: boolean;
  marginImpossible: boolean;
  cpmInvalid: boolean;
  issues: FinancialIntegrityIssue[];
};

export type FifoLineageNode = {
  lotId: number;
  accountId?: number | null;
  sourceEntryId?: number | null;
  operationEntryId?: number | null;
  operationKind: FinancialReplayKind;
  consumedAt?: string | null;
  acquiredPoints: number;
  consumedPoints: number;
  remainingPoints: number;
  timelineIndex: number;
  broken: boolean;
};

export type FifoLineage = {
  organizationId: number;
  accountId?: number | null;
  nodes: FifoLineageNode[];
};

export type FinancialReplayKind = "purchase" | "sale" | "transfer" | "entry" | "lot";

export type FinancialReplayEvent = {
  kind: FinancialReplayKind;
  id: number;
  organizationId: number;
  accountId?: number | null;
  occurredAt: string;
  points?: number | null;
  description?: string | null;
  status?: string | null;
  lineage?: Record<string, unknown>;
};

export type FinancialTimeline = {
  organizationId: number;
  accountId?: number | null;
  events: FinancialReplayEvent[];
};

export type FinancialIntegrityReport = {
  organizationId: number;
  accountId?: number | null;
  accountIntegrity: FinancialIntegrityResult;
  fifoIntegrity: FinancialIntegrityResult;
  ledgerIntegrity: FinancialIntegrityResult;
  timeline: FinancialTimeline;
  generatedAt: string;
};

export type AccountIntegritySummary = {
  organizationId: number;
  accountId?: number | null;
  currentBalance: number;
  reconciledBalance: number;
  divergence: number;
  integrityStatus: "consistent" | "warning" | "broken";
  warnings: string[];
};

export type FifoIntegritySummary = {
  organizationId: number;
  accountId?: number | null;
  totalLots: number;
  orphanLots: number;
  inconsistentLots: number;
  invalidRemainingPoints: number;
  fifoStatus: "consistent" | "warning" | "broken";
  warnings: string[];
};

export type LedgerIntegritySummary = {
  organizationId: number;
  accountId?: number | null;
  inconsistentEntries: number;
  invalidDelta: number;
  replayDivergence: number;
  brokenLineage: number;
  ledgerStatus: "consistent" | "warning" | "broken";
  warnings: string[];
};

export type FinancialInspection = {
  organizationId: number;
  accountId?: number | null;
  summary: AccountIntegritySummary;
  warnings: string[];
  issues: FinancialIntegrityIssue[];
};

export type FifoConsumptionInspection = {
  organizationId: number;
  accountId?: number | null;
  summary: FifoIntegritySummary;
  replay: FinancialTimeline;
  lineage: FifoLineage;
  warnings: string[];
};

export type FinancialReplayInspection = {
  organizationId: number;
  accountId?: number | null;
  summary: LedgerIntegritySummary;
  replay: FinancialTimeline;
  lineage: FifoLineage;
  warnings: string[];
};

export type FinancialRecoveryWorkflow =
  | "balance-reconcile"
  | "replay-reconcile"
  | "fifo-reconcile"
  | "lineage-rebuild";

export type FinancialRecoveryResult = {
  workflow: FinancialRecoveryWorkflow;
  organizationId: number;
  accountId: number | null;
  executedAt: string;
  actorUserId: string;
  actorEmail?: string | null;
  title: string;
  status: "consistent" | "warning" | "broken";
  warningCount: number;
  warnings: string[];
  recoveryAction: string;
  nextStep: string;
  escalation: string;
  details: Record<string, unknown>;
};

export type DuplicateOperationInput = {
  organizationId: number;
  accountId?: number | null;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  points?: number;
  totalCents?: number;
  receivedPoints?: number;
  bonusPercent?: number;
  feeCents?: number;
  description?: string | null;
  customerName?: string | null;
  occurredAt: Date;
};

function reportFinancialEvent(
  code: FinancialEventCode,
  message: string,
  details?: Record<string, unknown>,
): void {
  const payload = {
    code,
    timestamp: new Date().toISOString(),
    details: details ?? {},
  };

  if (code === "BALANCE_RECONCILIATION_WARNING" || code === "ORPHAN_LOT_DETECTED" || code === "NEGATIVE_BALANCE_DETECTED" || code === "DUPLICATE_OPERATION_BLOCKED") {
    console.warn(`[finance:${code}] ${message}`, payload);
    return;
  }

  console.info(`[finance:${code}] ${message}`, payload);
}

function emitAuditWarning(
  source: string,
  organizationId: number,
  issueCount: number,
  accountId?: number | null,
): void {
  reportFinancialEvent("LEDGER_AUDIT_WARNING", "Ledger audit warning", {
    source,
    organizationId,
    accountId: accountId ?? null,
    issueCount,
  });
}

function collectOperationalWarnings(issues: FinancialIntegrityIssue[]): string[] {
  const warnings = new Set<string>();

  for (const issue of issues) {
    if (issue.code === "NEGATIVE_BALANCE_DETECTED") {
      warnings.add("balance negative");
      warnings.add("saldo negativo");
    }

    if (issue.code === "BALANCE_ABOVE_ALLOWED_DETECTED") {
      warnings.add("saldo impossível");
    }

    if (issue.code === "FIFO_DIVERGENCE_DETECTED") {
      warnings.add("divergência de saldo");
      warnings.add("replay divergente");
    }

    if (issue.code === "ORPHAN_LOT_DETECTED") {
      warnings.add("lote órfão");
    }

    if (issue.code === "INVALID_CONSUMPTION_DETECTED") {
      warnings.add("consumo inválido");
      warnings.add("remaining points inválido");
    }

    if (issue.code === "DELTA_INCONSISTENT_DETECTED") {
      warnings.add("delta inválido");
      warnings.add("timeline impossível");
    }

    if (issue.code === "ACCOUNT_ORPHAN_DETECTED") {
      warnings.add("account orfã");
    }
  }

  return Array.from(warnings);
}

function summarizeIntegrityState(
  hasIssues: boolean,
  hasWarnings: boolean,
): "consistent" | "warning" | "broken" {
  if (hasIssues && hasWarnings) return "broken";
  if (hasWarnings) return "warning";
  return "consistent";
}

function isNotNullish(value: unknown): boolean {
  return value !== null && value !== undefined;
}

function floorWindowStart(occurredAt: Date, windowMinutes = 5): Date {
  return new Date(occurredAt.getTime() - windowMinutes * 60 * 1000);
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
}

function normalizeObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

async function loadFinancialReplayRows(
  runner: QueryRunner,
  organizationId: number,
  accountId?: number | null,
) {
  const accountFilter = accountId ? " AND account_id = $2" : "";
  const accountParams = accountId ? [organizationId, accountId] : [organizationId];

  let entriesRes;

  try {
    entriesRes = await runner.query(
      `SELECT id, organization_id, account_id, type, direction, points, amount_cents, occurred_at, description, source, status, consumed_lot_id, consumed_points, lot_snapshot, created_at
       FROM mile_entries
       WHERE organization_id = $1${accountFilter}
       ORDER BY occurred_at ASC, id ASC`,
      accountParams,
    );
  } catch (error: any) {
    if (
      error?.code === "42703" &&
      (String(error?.message ?? "").includes("consumed_lot_id") ||
        String(error?.message ?? "").includes("lot_snapshot"))
    ) {
      entriesRes = await runner.query(
        `SELECT id, organization_id, account_id, type, direction, points, amount_cents, occurred_at, description, source, status, created_at
         FROM mile_entries
         WHERE organization_id = $1${accountFilter}
         ORDER BY occurred_at ASC, id ASC`,
        accountParams,
      );
    } else {
      throw error;
    }
  }

  let lotsRes = { rows: [] as any[] };

  try {
    lotsRes = await runner.query(
      `SELECT id, organization_id, account_id, source_entry_id, acquired_points, remaining_points, total_cost_cents, cost_per_thousand_cents, issued_at, expires_at, status, created_at
       FROM mile_point_lots
       WHERE organization_id = $1${accountFilter}
       ORDER BY issued_at ASC, id ASC`,
      accountParams,
    );
  } catch (error: any) {
    if (
      error?.code === "42703" &&
      String(error?.message ?? "").includes("source_entry_id")
    ) {
      lotsRes = await runner.query(
        `SELECT id, organization_id, account_id, acquired_points, remaining_points, total_cost_cents, cost_per_thousand_cents, issued_at, expires_at, status, created_at
         FROM mile_point_lots
         WHERE organization_id = $1${accountFilter}
         ORDER BY issued_at ASC, id ASC`,
        accountParams,
      );
    } else if (error?.code === "42P01" && String(error?.message ?? "").includes("mile_point_lots")) {
      lotsRes = { rows: [] };
    } else {
      throw error;
    }
  }

  let transfersRes;

  try {
    transfersRes = await runner.query(
      `SELECT id, organization_id, from_account_id, to_account_id, points_sent, points_received, transferred_at, status, description, source_entry_id, destination_entry_id, created_at
       FROM mile_transfers
       WHERE organization_id = $1${accountId ? " AND (from_account_id = $2 OR to_account_id = $2)" : ""}
       ORDER BY transferred_at ASC, id ASC`,
      accountParams,
    );
  } catch (error: any) {
    if (
      error?.code === "42703" &&
      (String(error?.message ?? "").includes("source_entry_id") ||
        String(error?.message ?? "").includes("destination_entry_id"))
    ) {
      transfersRes = await runner.query(
        `SELECT id, organization_id, from_account_id, to_account_id, points_sent, points_received, transferred_at, status, description, created_at
         FROM mile_transfers
         WHERE organization_id = $1${accountId ? " AND (from_account_id = $2 OR to_account_id = $2)" : ""}
         ORDER BY transferred_at ASC, id ASC`,
        accountParams,
      );
    } else {
      throw error;
    }
  }

  return { entriesRes, lotsRes, transfersRes };
}

export async function buildFinancialTimeline(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
  },
): Promise<FinancialTimeline> {
  const { entriesRes, lotsRes, transfersRes } = await loadFinancialReplayRows(
    runner,
    input.organizationId,
    input.accountId ?? null,
  );

  const events: FinancialReplayEvent[] = [];

  for (const entry of entriesRes.rows) {
    const lotSnapshot = normalizeObject(entry.lot_snapshot);
    const lineage = lotSnapshot
      ? { lotSnapshot }
      : entry.consumed_lot_id
        ? {
            consumedLotId: entry.consumed_lot_id,
            consumedPoints: entry.consumed_points ?? null,
          }
        : undefined;

    events.push({
      kind: entry.type === "purchase"
        ? "purchase"
        : entry.type === "sale"
          ? "sale"
          : entry.type === "transfer"
            ? "transfer"
            : "entry",
      id: entry.id,
      organizationId: entry.organization_id,
      accountId: entry.account_id ?? null,
      occurredAt: toIso(entry.occurred_at ?? entry.created_at),
      points: entry.points ?? null,
      description: entry.description ?? null,
      status: entry.status ?? null,
      lineage,
    });
  }

  for (const lot of lotsRes.rows) {
    events.push({
      kind: "lot",
      id: lot.id,
      organizationId: lot.organization_id,
      accountId: lot.account_id ?? null,
      occurredAt: toIso(lot.issued_at ?? lot.created_at),
      points: lot.remaining_points ?? null,
      description: `lot:${lot.source_entry_id ?? "n/a"}`,
      status: lot.status ?? null,
      lineage: {
        sourceEntryId: lot.source_entry_id ?? null,
        acquiredPoints: lot.acquired_points ?? null,
        remainingPoints: lot.remaining_points ?? null,
        totalCostCents: lot.total_cost_cents ?? null,
        costPerThousandCents: lot.cost_per_thousand_cents ?? null,
      },
    });
  }

  events.sort((left, right) => {
    const leftTime = new Date(left.occurredAt).getTime();
    const rightTime = new Date(right.occurredAt).getTime();
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id - right.id;
  });

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    events,
  };
}

export async function buildFifoLineage(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
  },
): Promise<FifoLineage> {
  const { entriesRes, lotsRes, transfersRes } = await loadFinancialReplayRows(
    runner,
    input.organizationId,
    input.accountId ?? null,
  );
  const nodes: FifoLineageNode[] = [];

  const purchaseAndSaleEvents = (entriesRes.rows as any[]).map((entry) => ({
    kind:
      entry.type === "purchase"
        ? "purchase"
        : entry.type === "sale"
          ? "sale"
          : entry.type === "transfer"
            ? "transfer"
            : "entry",
    id: entry.id,
    accountId: entry.account_id ?? null,
    occurredAt: toIso(entry.occurred_at ?? entry.created_at),
    points: entry.points ?? null,
    lineage: normalizeObject(entry.lot_snapshot),
  }));

  purchaseAndSaleEvents.forEach((event, timelineIndex) => {
    if (event.kind === "purchase") {
      nodes.push({
        lotId: event.id,
        accountId: event.accountId ?? null,
        sourceEntryId: event.id,
        operationEntryId: event.id,
        operationKind: "purchase",
        consumedAt: null,
        acquiredPoints: Number(event.points ?? 0),
        consumedPoints: 0,
        remainingPoints: Number(event.points ?? 0),
        timelineIndex,
        broken: false,
      });
      return;
    }

    if (event.kind === "sale") {
      const lotSnapshot = normalizeObject(event.lineage?.lotSnapshot);
      const consumedLots = Array.isArray(lotSnapshot?.consumedLots)
        ? (lotSnapshot?.consumedLots as any[])
        : [];

      if (consumedLots.length === 0) {
        nodes.push({
          lotId: event.id,
          accountId: event.accountId ?? null,
          sourceEntryId: null,
          operationEntryId: event.id,
          operationKind: "sale",
          consumedAt: event.occurredAt,
          acquiredPoints: Number(event.points ?? 0),
          consumedPoints: Number(event.points ?? 0),
          remainingPoints: 0,
          timelineIndex,
          broken: true,
        });
        return;
      }

      consumedLots.forEach((consumedLot, consumedIndex) => {
        nodes.push({
          lotId: Number(consumedLot.lotId ?? event.id),
          accountId: event.accountId ?? null,
          sourceEntryId: event.id,
          operationEntryId: event.id,
          operationKind: "sale",
          consumedAt: event.occurredAt,
          acquiredPoints: Number(consumedLot.consumedPoints ?? event.points ?? 0),
          consumedPoints: Number(consumedLot.consumedPoints ?? 0),
          remainingPoints: Number(consumedLot.remainingPointsAfterConsumption ?? 0),
          timelineIndex: timelineIndex + consumedIndex,
          broken:
            Number(consumedLot.consumedPoints ?? 0) <= 0 ||
            Number(consumedLot.remainingPointsAfterConsumption ?? -1) < 0,
        });
      });
      return;
    }

    if (event.kind === "transfer") {
      nodes.push({
        lotId: event.id,
        accountId: event.accountId ?? null,
        sourceEntryId: (transfersRes.rows as any[]).find(
          (transfer) => transfer.source_entry_id !== null && transfer.source_entry_id !== undefined && Number(transfer.source_entry_id) > 0,
        )?.source_entry_id ?? null,
        operationEntryId: (transfersRes.rows as any[]).find(
          (transfer) => transfer.destination_entry_id !== null && transfer.destination_entry_id !== undefined && Number(transfer.destination_entry_id) > 0,
        )?.destination_entry_id ?? event.id,
        operationKind: "transfer",
        consumedAt: event.occurredAt,
        acquiredPoints: Number(event.points ?? 0),
        consumedPoints: Number(event.points ?? 0),
        remainingPoints: Number(event.points ?? 0),
        timelineIndex,
        broken:
          !transfersRes.rows.some(
            (transfer) =>
              isNotNullish(transfer.source_entry_id) &&
              isNotNullish(transfer.destination_entry_id),
          ),
      });
    }
  });

  reportFinancialEvent("FIFO_LINEAGE_BUILT", "FIFO lineage built", {
    source: "buildFifoLineage",
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    nodeCount: nodes.length,
  });

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    nodes,
  };
}

async function loadAccountSummaryState(
  runner: QueryRunner,
  input: { organizationId: number; accountId?: number | null },
) {
  const accountParams = input.accountId ? [input.organizationId, input.accountId] : [input.organizationId];
  const accountFilter = input.accountId ? " AND id = $2" : "";

  const accountsRes = await runner.query(
    `SELECT id, organization_id, current_points_balance, current_cost_basis_cents, current_avg_cost_per_thousand_cents
     FROM program_accounts
     WHERE organization_id = $1${accountFilter}`,
    accountParams,
  );

  let lotsRes = { rows: [] as any[] };

  try {
    lotsRes = await runner.query(
      `SELECT account_id, acquired_points, remaining_points
       FROM mile_point_lots
       WHERE organization_id = $1${input.accountId ? " AND account_id = $2" : ""}`,
      accountParams,
    );
  } catch (error: any) {
    if (!(error?.code === "42P01" && String(error?.message ?? "").includes("mile_point_lots"))) {
      throw error;
    }
  }

  const account = (accountsRes.rows as any[])[0] ?? null;
  const currentBalance = Number(account?.current_points_balance ?? 0);
  const reconciledBalance = (lotsRes.rows as any[]).reduce(
    (sum, lot) => sum + Number(lot.remaining_points ?? 0),
    0,
  );
  const divergence = currentBalance - reconciledBalance;

  return {
    account,
    currentBalance,
    reconciledBalance,
    divergence,
  };
}

export async function buildAccountIntegritySummary(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<AccountIntegritySummary> {
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "account-integrity-summary",
    emitEvents: false,
  });
  const { currentBalance, reconciledBalance, divergence } = await loadAccountSummaryState(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const warnings = collectOperationalWarnings(integrity.issues);

  const summary: AccountIntegritySummary = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    currentBalance,
    reconciledBalance,
    divergence,
    integrityStatus: summarizeIntegrityState(integrity.issues.length > 0, warnings.length > 0),
    warnings,
  };

  if (input.emitEvents ?? true) {
    reportFinancialEvent("ACCOUNT_INTEGRITY_SUMMARY_CREATED", "Account integrity summary created", {
      source: input.source ?? "account-integrity-summary",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      integrityStatus: summary.integrityStatus,
      warningCount: summary.warnings.length,
    });

    if (summary.warnings.length > 0) {
      reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
        source: input.source ?? "account-integrity-summary",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        warningCount: summary.warnings.length,
      });
    }
  }

  return summary;
}

export async function buildFifoIntegritySummary(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<FifoIntegritySummary> {
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "fifo-integrity-summary",
    emitEvents: false,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lotsRes = await runner.query(
    `SELECT id, account_id, acquired_points, remaining_points, organization_id
     FROM mile_point_lots
     WHERE organization_id = $1${input.accountId ? " AND account_id = $2" : ""}`,
    input.accountId ? [input.organizationId, input.accountId] : [input.organizationId],
  ).catch((error: any) => {
    if (error?.code === "42P01" && String(error?.message ?? "").includes("mile_point_lots")) {
      return { rows: [] };
    }

    throw error;
  });
  const warnings = collectOperationalWarnings(integrity.issues);
  const invalidRemainingPoints = integrity.issues.filter(
    (issue) => issue.code === "INVALID_CONSUMPTION_DETECTED",
  ).length;

  const summary: FifoIntegritySummary = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    totalLots: (lotsRes.rows as any[]).length,
    orphanLots: integrity.issues.filter((issue) => issue.code === "ORPHAN_LOT_DETECTED").length,
    inconsistentLots: lineage.nodes.filter((node) => node.broken).length,
    invalidRemainingPoints,
    fifoStatus: summarizeIntegrityState(integrity.issues.length > 0, warnings.length > 0),
    warnings,
  };

  if (input.emitEvents ?? true) {
    reportFinancialEvent("FIFO_INTEGRITY_SUMMARY_CREATED", "FIFO integrity summary created", {
      source: input.source ?? "fifo-integrity-summary",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      fifoStatus: summary.fifoStatus,
      warningCount: summary.warnings.length,
    });

    if (summary.warnings.length > 0) {
      reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
        source: input.source ?? "fifo-integrity-summary",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        warningCount: summary.warnings.length,
      });
    }
  }

  return summary;
}

export async function buildLedgerIntegritySummary(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<LedgerIntegritySummary> {
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "ledger-integrity-summary",
    emitEvents: false,
  });
  const timeline = await buildFinancialTimeline(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const warnings = collectOperationalWarnings(integrity.issues);
  const summary: LedgerIntegritySummary = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    inconsistentEntries: integrity.issues.filter(
      (issue) =>
        issue.code === "DELTA_INCONSISTENT_DETECTED" ||
        issue.code === "FIFO_DIVERGENCE_DETECTED",
    ).length,
    invalidDelta: integrity.issues.filter((issue) => issue.code === "DELTA_INCONSISTENT_DETECTED").length,
    replayDivergence: timeline.events.length - lineage.nodes.length,
    brokenLineage: lineage.nodes.filter((node) => node.broken).length,
    ledgerStatus: summarizeIntegrityState(integrity.issues.length > 0, warnings.length > 0),
    warnings,
  };

  if (input.emitEvents ?? true) {
    reportFinancialEvent("LEDGER_INTEGRITY_SUMMARY_CREATED", "Ledger integrity summary created", {
      source: input.source ?? "ledger-integrity-summary",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      ledgerStatus: summary.ledgerStatus,
      warningCount: summary.warnings.length,
    });

    if (summary.warnings.length > 0) {
      reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
        source: input.source ?? "ledger-integrity-summary",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        warningCount: summary.warnings.length,
      });
    }
  }

  return summary;
}

export async function inspectFinancialAccount(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
  },
): Promise<FinancialInspection> {
  const summary = await buildAccountIntegritySummary(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "financial-account-inspection",
    emitEvents: false,
  });
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "financial-account-inspection",
    emitEvents: false,
  });

  reportFinancialEvent("FINANCIAL_ACCOUNT_INSPECTED", "Financial account inspected", {
    source: input.source ?? "financial-account-inspection",
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    integrityStatus: summary.integrityStatus,
    warningCount: summary.warnings.length,
  });

  if (summary.warnings.length > 0) {
    reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
      source: input.source ?? "financial-account-inspection",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      warningCount: summary.warnings.length,
    });
  }

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    summary,
    warnings: summary.warnings,
    issues: integrity.issues,
  };
}

export async function inspectFifoConsumption(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
  },
): Promise<FifoConsumptionInspection> {
  const summary = await buildFifoIntegritySummary(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "fifo-consumption-inspection",
    emitEvents: false,
  });
  const replay = await buildFinancialTimeline(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });

  reportFinancialEvent("FIFO_CONSUMPTION_INSPECTED", "FIFO consumption inspected", {
    source: input.source ?? "fifo-consumption-inspection",
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    fifoStatus: summary.fifoStatus,
    warningCount: summary.warnings.length,
  });

  if (summary.warnings.length > 0) {
    reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
      source: input.source ?? "fifo-consumption-inspection",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      warningCount: summary.warnings.length,
    });
  }

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    summary,
    replay,
    lineage,
    warnings: summary.warnings,
  };
}

export async function inspectFinancialReplay(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
  },
): Promise<FinancialReplayInspection> {
  const summary = await buildLedgerIntegritySummary(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "financial-replay-inspection",
    emitEvents: false,
  });
  const replay = await buildFinancialTimeline(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });

  if (summary.warnings.length > 0) {
    reportFinancialEvent("FINANCIAL_WARNING_DETECTED", "Financial warning detected", {
      source: input.source ?? "financial-replay-inspection",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      warningCount: summary.warnings.length,
    });
  }

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    summary,
    replay,
    lineage,
    warnings: summary.warnings,
  };
}

export async function createFinancialIntegrityReport(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<FinancialIntegrityReport> {
  const accountIntegrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "financial-integrity-report",
    emitEvents: false,
  });

  const fifoIntegrity = accountIntegrity;
  const ledgerIntegrity = accountIntegrity;
  const timeline = await buildFinancialTimeline(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });

  const generatedAt = new Date().toISOString();

  if (input.emitEvents) {
    reportFinancialEvent("FINANCIAL_INTEGRITY_REPORT_CREATED", "Financial integrity report created", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      eventCount: timeline.events.length,
    });

    reportFinancialEvent("FINANCIAL_REPLAY_EXECUTED", "Financial replay executed", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      eventCount: timeline.events.length,
    });

    reportFinancialEvent("FIFO_LINEAGE_VALIDATED", "FIFO lineage validated", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      eventCount: timeline.events.length,
    });

    reportFinancialEvent("FINANCIAL_TIMELINE_BUILT", "Financial timeline built", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      eventCount: timeline.events.length,
    });

    reportFinancialEvent("FINANCIAL_REPLAY_EXECUTED", "Financial replay executed", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      eventCount: timeline.events.length,
      lineageCount: lineage.nodes.length,
    });

    if (!accountIntegrity.isConsistent) {
      emitAuditWarning(
        input.source ?? "financial-integrity-report",
        input.organizationId,
        accountIntegrity.issues.length,
        input.accountId ?? null,
      );
      reportFinancialEvent(
        "BALANCE_DRIFT_DETECTED",
        "Balance drift detected during report creation",
        {
          source: input.source ?? "financial-integrity-report",
          organizationId: input.organizationId,
          accountId: input.accountId ?? null,
          issueCount: accountIntegrity.issues.length,
        },
      );
    }

    if (lineage.nodes.some((node) => node.broken)) {
      reportFinancialEvent("FIFO_INTEGRITY_WARNING", "FIFO lineage contains broken nodes", {
        source: input.source ?? "financial-integrity-report",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        brokenCount: lineage.nodes.filter((node) => node.broken).length,
      });
    }

    reportFinancialEvent("ACCOUNT_INTEGRITY_REPORT_CREATED", "Account integrity report created", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      issueCount: accountIntegrity.issues.length,
      accountExists: accountIntegrity.checkedAccounts > 0,
    });

    reportFinancialEvent("LEDGER_REPLAY_VALIDATED", "Ledger replay validated", {
      source: input.source ?? "financial-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      replayNodes: timeline.events.length,
      lineageNodes: lineage.nodes.length,
    });
  }

  return {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    accountIntegrity,
    fifoIntegrity,
    ledgerIntegrity,
    timeline,
    generatedAt,
  };
}

export async function generateAccountIntegrityReport(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<AccountIntegrityReport> {
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "account-integrity-report",
    emitEvents: false,
  });

  const accountExists = input.accountId ? integrity.checkedAccounts > 0 : true;
  const report: AccountIntegrityReport = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    accountExists,
    ownershipConsistent: accountExists,
    balanceConsistent: integrity.issues.every(
      (issue) =>
        issue.code !== "FIFO_DIVERGENCE_DETECTED" &&
        issue.code !== "NEGATIVE_BALANCE_DETECTED",
    ),
    balanceNegative: integrity.issues.some(
      (issue) => issue.code === "NEGATIVE_BALANCE_DETECTED",
    ),
    orphanAccount: input.accountId ? !accountExists : false,
    driftDetected: !integrity.isConsistent,
    issues: integrity.issues,
  };

  if (input.emitEvents) {
    reportFinancialEvent(
      "ACCOUNT_INTEGRITY_REPORT_CREATED",
      "Account integrity report created",
      {
        source: input.source ?? "account-integrity-report",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        issueCount: report.issues.length,
        accountExists: report.accountExists,
      },
    );

    if (!report.balanceConsistent || report.orphanAccount || report.balanceNegative) {
      reportFinancialEvent(
        "BALANCE_DRIFT_DETECTED",
        "Balance drift detected",
        {
          source: input.source ?? "account-integrity-report",
          organizationId: input.organizationId,
          accountId: input.accountId ?? null,
          issueCount: report.issues.length,
        },
      );
    }
  }

  return report;
}

export async function generateFifoIntegrityReport(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<FifoIntegrityReport> {
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "fifo-integrity-report",
    emitEvents: false,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const orphanLots = integrity.issues.filter(
    (issue) => issue.code === "ORPHAN_LOT_DETECTED",
  ).length;
  const invalidRemainingPoints = integrity.issues.some(
    (issue) => issue.code === "INVALID_CONSUMPTION_DETECTED",
  );
  const consumptionImpossible = lineage.nodes.some((node) => node.broken);
  const report: FifoIntegrityReport = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    lineageBroken: consumptionImpossible,
    orphanLots,
    invalidRemainingPoints,
    consumptionImpossible,
    issues: integrity.issues,
  };

  if (input.emitEvents) {
    reportFinancialEvent(
      "FIFO_LINEAGE_VALIDATED",
      "FIFO lineage validated",
      {
        source: input.source ?? "fifo-integrity-report",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        nodeCount: lineage.nodes.length,
      },
    );

    if (report.lineageBroken || report.invalidRemainingPoints || report.orphanLots > 0) {
      reportFinancialEvent("FIFO_INTEGRITY_WARNING", "FIFO integrity warning", {
        source: input.source ?? "fifo-integrity-report",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        orphanLots: report.orphanLots,
      });
    }
  }

  return report;
}

export async function generateLedgerIntegrityReport(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<LedgerIntegrityReport> {
  const timeline = await buildFinancialTimeline(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const lineage = await buildFifoLineage(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
  });
  const integrity = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "ledger-integrity-report",
    emitEvents: false,
  });
  const replayConsistent =
    integrity.isConsistent && !lineage.nodes.some((node) => node.broken);
  const deltaImpossible = integrity.issues.some(
    (issue) => issue.code === "DELTA_INCONSISTENT_DETECTED",
  );
  const marginImpossible = integrity.issues.some(
    (issue) => issue.code === "BALANCE_ABOVE_ALLOWED_DETECTED",
  );
  const cpmInvalid = integrity.issues.some(
    (issue) => issue.code === "DELTA_INCONSISTENT_DETECTED",
  );
  const report: LedgerIntegrityReport = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    replayConsistent,
    ledgerConsistent: integrity.isConsistent,
    deltaImpossible,
    marginImpossible,
    cpmInvalid,
    issues: integrity.issues,
  };

  if (input.emitEvents) {
    reportFinancialEvent("LEDGER_REPLAY_VALIDATED", "Ledger replay validated", {
      source: input.source ?? "ledger-integrity-report",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
      replayNodes: timeline.events.length,
      lineageNodes: lineage.nodes.length,
    });

    if (!report.replayConsistent || report.deltaImpossible || report.marginImpossible || report.cpmInvalid) {
      reportFinancialEvent("FINANCIAL_DRIFT_DETECTED", "Financial drift detected", {
        source: input.source ?? "ledger-integrity-report",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        issueCount: report.issues.length,
      });
    }
  }

  return report;
}

export async function validateFinancialIntegrity(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
    emitEvents?: boolean;
  },
): Promise<FinancialIntegrityResult> {
  const params: any[] = [input.organizationId];
  const accountFilter = input.accountId ? " AND id = $2" : "";
  const legacySchemaMode = { enabled: false };

  if (input.accountId) params.push(input.accountId);

  const accountsRes = await runner.query(
    `SELECT id, organization_id, current_points_balance, current_cost_basis_cents, current_avg_cost_per_thousand_cents
     FROM program_accounts
     WHERE organization_id = $1${accountFilter}`,
    params,
  );

  let lotsRes: { rows: any[] } = { rows: [] };
  let orphanLotsRes: { rows: any[] } = { rows: [] };

  try {
    lotsRes = await runner.query(
      `SELECT id, account_id, acquired_points, remaining_points, organization_id
       FROM mile_point_lots
       WHERE organization_id = $1`,
      [input.organizationId],
    );

    orphanLotsRes = await runner.query(
      `SELECT l.id, l.account_id
       FROM mile_point_lots l
       LEFT JOIN program_accounts a ON a.id = l.account_id
       WHERE l.organization_id = $1 AND a.id IS NULL`,
      [input.organizationId],
    );
  } catch (error: any) {
    if (error?.code === "42P01" && String(error?.message ?? "").includes("mile_point_lots")) {
      legacySchemaMode.enabled = true;
    } else {
      throw error;
    }
  }

  const issues: FinancialIntegrityIssue[] = [];
  const lotsByAccount = new Map<number, any[]>();

  if (input.accountId && accountsRes.rows.length === 0) {
    issues.push({ code: "ACCOUNT_ORPHAN_DETECTED", accountId: input.accountId });
  }

  for (const lot of lotsRes.rows) {
    if (!isNotNullish(lot.account_id)) continue;
    const accountLots = lotsByAccount.get(lot.account_id) ?? [];
    accountLots.push(lot);
    lotsByAccount.set(lot.account_id, accountLots);
  }

  for (const account of accountsRes.rows) {
    if (Number(account.organization_id ?? input.organizationId) !== input.organizationId) {
      issues.push({
        code: "OWNERSHIP_INCONSISTENT_DETECTED",
        accountId: account.id,
      });
    }

    const balance = Number(account.current_points_balance ?? 0);
    const cpm = Number(account.current_avg_cost_per_thousand_cents ?? 0);
    const costBasis = Number(account.current_cost_basis_cents ?? 0);
    const accountLots = lotsByAccount.get(account.id) ?? [];
    const totalRemaining = accountLots.reduce(
      (sum, lot) => sum + Number(lot.remaining_points ?? 0),
      0,
    );
    const totalAcquired = accountLots.reduce(
      (sum, lot) => sum + Number(lot.acquired_points ?? 0),
      0,
    );

    if (balance < 0) {
      issues.push({ code: "NEGATIVE_BALANCE_DETECTED", accountId: account.id });
    }

    if (balance !== totalRemaining) {
      issues.push({ code: "FIFO_DIVERGENCE_DETECTED", accountId: account.id });
    }

    if (balance > totalRemaining) {
      issues.push({ code: "BALANCE_ABOVE_ALLOWED_DETECTED", accountId: account.id });
    }

    if (costBasis < 0 || cpm < 0) {
      issues.push({ code: "DELTA_INCONSISTENT_DETECTED", accountId: account.id });
    }

    const expectedCostBasis = Math.round((balance * cpm) / 1000);
    if (costBasis !== expectedCostBasis && (balance > 0 || costBasis > 0)) {
      issues.push({ code: "DELTA_INCONSISTENT_DETECTED", accountId: account.id });
    }

    if (totalRemaining < 0 || totalAcquired < 0) {
      issues.push({ code: "INVALID_CONSUMPTION_DETECTED", accountId: account.id });
    }

    for (const lot of accountLots) {
      const remaining = Number(lot.remaining_points ?? 0);
      const acquired = Number(lot.acquired_points ?? 0);

      if (remaining < 0 || remaining > acquired) {
        issues.push({
          code: "INVALID_CONSUMPTION_DETECTED",
          accountId: account.id,
          lotId: lot.id,
        });
      }
    }
  }

  for (const orphanLot of orphanLotsRes.rows) {
    issues.push({
      code: "ORPHAN_LOT_DETECTED",
      lotId: orphanLot.id,
    });
  }

  const result: FinancialIntegrityResult = {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    checkedAccounts: accountsRes.rows.length,
    issues,
    isConsistent: issues.length === 0,
  };

  if (legacySchemaMode.enabled && input.emitEvents) {
    reportFinancialEvent(
      "FINANCIAL_LEGACY_SCHEMA_DETECTED",
      "Financial integrity skipped lot checks because mile_point_lots is missing",
      {
        source: input.source ?? "financial-integrity",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
      },
    );
  }

  if (input.emitEvents) {
    if (result.isConsistent) {
      reportFinancialEvent(
        "BALANCE_RECONCILIATION_SUCCESS",
        "Financial integrity validated",
        {
          source: input.source ?? "financial-integrity",
          organizationId: input.organizationId,
          accountId: input.accountId ?? null,
          checkedAccounts: result.checkedAccounts,
        },
      );
    } else {
      reportFinancialEvent(
        "BALANCE_RECONCILIATION_WARNING",
        "Financial integrity validation found issues",
        {
          source: input.source ?? "financial-integrity",
          organizationId: input.organizationId,
          accountId: input.accountId ?? null,
          checkedAccounts: result.checkedAccounts,
          issueCount: result.issues.length,
        },
      );

      for (const issue of result.issues) {
        if (issue.code === "NEGATIVE_BALANCE_DETECTED") {
          reportFinancialEvent(
            "NEGATIVE_BALANCE_DETECTED",
            "Negative balance detected",
            {
              source: input.source ?? "financial-integrity",
              organizationId: input.organizationId,
              accountId: issue.accountId ?? null,
            },
          );
        }

        if (issue.code === "ORPHAN_LOT_DETECTED") {
          reportFinancialEvent(
            "ORPHAN_LOT_DETECTED",
            "Orphan lot detected",
            {
              source: input.source ?? "financial-integrity",
              organizationId: input.organizationId,
              lotId: issue.lotId ?? null,
            },
          );
        }
      }
    }
  }

  return result;
}

export async function reconcileProgramAccountBalance(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId: number;
    source?: string;
  },
): Promise<FinancialIntegrityResult> {
  return validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId,
    source: input.source ?? "reconcile-program-account-balance",
    emitEvents: true,
  });
}

export async function validateAccountIntegrity(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId: number;
    source?: string;
  },
): Promise<FinancialIntegrityResult> {
  return validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId,
    source: input.source ?? "validate-account-integrity",
    emitEvents: true,
  });
}

export async function recoverFinancialIntegrity(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId?: number | null;
    source?: string;
  },
): Promise<FinancialIntegrityResult> {
  reportFinancialEvent(
    "AUTOMATIC_RECONCILIATION_TRIGGERED",
    "Automatic reconciliation triggered",
    {
      source: input.source ?? "fifo-runtime-recovery",
      organizationId: input.organizationId,
      accountId: input.accountId ?? null,
    },
  );

  const result = await validateFinancialIntegrity(runner, {
    organizationId: input.organizationId,
    accountId: input.accountId ?? null,
    source: input.source ?? "fifo-runtime-recovery",
    emitEvents: true,
  });

  if (result.isConsistent) {
    reportFinancialEvent(
      "FIFO_RUNTIME_RECOVERY",
      "FIFO runtime recovery completed",
      {
        source: input.source ?? "fifo-runtime-recovery",
        organizationId: input.organizationId,
        accountId: input.accountId ?? null,
        checkedAccounts: result.checkedAccounts,
      },
    );
  }

  return result;
}

export async function executeFinancialRecoveryWorkflow(
  runner: QueryRunner,
  input: {
    workflow: FinancialRecoveryWorkflow;
    organizationId: number;
    accountId: number;
    actorUserId: string;
    actorEmail?: string | null;
    source?: string;
  },
): Promise<FinancialRecoveryResult> {
  const executedAt = new Date().toISOString();
  const source = input.source ?? "financial-recovery-workflow";

  let title = "Recuperação operacional";
  let status: FinancialRecoveryResult["status"] = "consistent";
  let warnings: string[] = [];
  let recoveryAction = "Validar a conta e repetir a inspeção";
  let nextStep = "Revalide após a recuperação.";
  let escalation = "Escale engenharia se a inconsistência persistir.";
  let details: Record<string, unknown> = {};

  if (input.workflow === "balance-reconcile") {
    title = "Reconciliação de saldo";
    const result = await reconcileProgramAccountBalance(runner, {
      organizationId: input.organizationId,
      accountId: input.accountId,
      source,
    });
    warnings = collectOperationalWarnings(result.issues);
    status = summarizeIntegrityState(result.issues.length > 0, warnings.length > 0);
    recoveryAction = "Executar reconcile de saldo e revisar os últimos lotes.";
    nextStep = warnings.length
      ? "Reabra a inspeção da conta e confirme se a divergência desapareceu."
      : "Nenhuma ação adicional é necessária agora.";
    escalation = warnings.length
      ? "Escale se o saldo continuar divergente após a reconciliação."
      : "Escale apenas se houver novo drift após novas operações.";
    details = { checkedAccounts: result.checkedAccounts, issueCount: result.issues.length };
  }

  if (input.workflow === "replay-reconcile") {
    title = "Reconciliação de replay";
    const result = await inspectFinancialReplay(runner, {
      organizationId: input.organizationId,
      accountId: input.accountId,
      source,
    });
    warnings = result.warnings;
    status = result.summary.ledgerStatus;
    recoveryAction = "Reexecutar replay reconcile e comparar a timeline com o último lançamento.";
    nextStep = warnings.length
      ? "Reveja os eventos mais recentes e compare com a timeline reconstruída."
      : "Replay reconciliado sem inconsistências adicionais.";
    escalation = warnings.length
      ? "Escale se eventos faltantes ou duplicados persistirem após a validação."
      : "Escale apenas se um novo drift surgir em nova inspeção.";
    details = { replayDivergence: result.summary.replayDivergence, brokenLineage: result.summary.brokenLineage };
  }

  if (input.workflow === "fifo-reconcile") {
    title = "Reconciliação FIFO";
    const result = await inspectFifoConsumption(runner, {
      organizationId: input.organizationId,
      accountId: input.accountId,
      source,
    });
    warnings = result.warnings;
    status = result.summary.fifoStatus;
    recoveryAction = "Executar reconcile FIFO e revisar a ordem de consumo dos lotes.";
    nextStep = warnings.length
      ? "Reavalie os lotes recentes e compare com o consumo operacional."
      : "FIFO reconciliado sem inconsistências visíveis.";
    escalation = warnings.length
      ? "Escale se a ordem de consumo não fechar após a reconciliação."
      : "Escale apenas se o próximo consumo gerar novo drift.";
    details = { totalLots: result.summary.totalLots, orphanLots: result.summary.orphanLots, inconsistentLots: result.summary.inconsistentLots };
  }

  if (input.workflow === "lineage-rebuild") {
    title = "Rebuild de lineage";
    const replay = await inspectFinancialReplay(runner, {
      organizationId: input.organizationId,
      accountId: input.accountId,
      source,
    });
    const lineage = await buildFifoLineage(runner, {
      organizationId: input.organizationId,
      accountId: input.accountId,
    });
    warnings = replay.warnings;
    status = replay.summary.ledgerStatus;
    recoveryAction = "Reconstruir lineage e validar a origem de cada evento operacional.";
    nextStep = warnings.length
      ? "Revise a origem dos eventos e valide a trilha reconstruída."
      : "Lineage reconstruída sem divergência adicional.";
    escalation = warnings.length
      ? "Escale se não for possível vincular eventos à origem operacional."
      : "Escale se uma nova operação quebrar a rastreabilidade.";
    details = { nodeCount: lineage.nodes.length, replayDivergence: replay.summary.replayDivergence };
  }

  reportFinancialEvent("FINANCIAL_RECOVERY_EXECUTED", "Financial recovery workflow executed", {
    source,
    workflow: input.workflow,
    organizationId: input.organizationId,
    accountId: input.accountId,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail ?? null,
    executedAt,
    warningCount: warnings.length,
    status,
  });

  return {
    workflow: input.workflow,
    organizationId: input.organizationId,
    accountId: input.accountId,
    executedAt,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail ?? null,
    title,
    status,
    warningCount: warnings.length,
    warnings,
    recoveryAction,
    nextStep,
    escalation,
    details,
  };
}

export async function ensureNoDuplicatePurchase(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId: number;
    points: number;
    totalCostCents: number;
    purchasedAt: Date;
    description?: string | null;
  },
): Promise<boolean> {
  const windowStart = floorWindowStart(input.purchasedAt, 5);
  const rows = await runner.query(
    `SELECT id
     FROM mile_purchases
     WHERE organization_id = $1
       AND account_id = $2
       AND points = $3
       AND total_cost_cents = $4
       AND COALESCE(description, '') = COALESCE($5, '')
       AND status = 'completed'
       AND created_at >= $6
     LIMIT 1`,
    [
      input.organizationId,
      input.accountId,
      input.points,
      input.totalCostCents,
      input.description ?? null,
      windowStart,
    ],
  );

  const duplicate = (rows.rows as any[])[0];

  if (duplicate) {
    reportFinancialEvent("DUPLICATE_OPERATION_BLOCKED", "Duplicate purchase blocked", {
      operation: "purchase",
      organizationId: input.organizationId,
      accountId: input.accountId,
    });
    return true;
  }

  return false;
}

export async function ensureNoDuplicateSale(
  runner: QueryRunner,
  input: {
    organizationId: number;
    accountId: number;
    points: number;
    totalAmountCents: number;
    soldAt: Date;
    description?: string | null;
    customerName?: string | null;
  },
): Promise<boolean> {
  const windowStart = floorWindowStart(input.soldAt, 5);
  const rows = await runner.query(
    `SELECT id
     FROM mile_sales
     WHERE organization_id = $1
       AND account_id = $2
       AND points = $3
       AND revenue_cents = $4
       AND COALESCE(description, '') = COALESCE($5, '')
       AND COALESCE(customer_name, '') = COALESCE($6, '')
       AND status = 'completed'
       AND created_at >= $7
     LIMIT 1`,
    [
      input.organizationId,
      input.accountId,
      input.points,
      input.totalAmountCents,
      input.description ?? null,
      input.customerName ?? null,
      windowStart,
    ],
  );

  const duplicate = (rows.rows as any[])[0];

  if (duplicate) {
    reportFinancialEvent("DUPLICATE_OPERATION_BLOCKED", "Duplicate sale blocked", {
      operation: "sale",
      organizationId: input.organizationId,
      accountId: input.accountId,
    });
    return true;
  }

  return false;
}

export async function ensureNoDuplicateTransfer(
  runner: QueryRunner,
  input: {
    organizationId: number;
    fromAccountId: number;
    toAccountId: number;
    pointsSent: number;
    pointsReceived: number;
    feeCents: number;
    bonusPercent: number;
    transferredAt: Date;
    description?: string | null;
  },
): Promise<boolean> {
  const windowStart = floorWindowStart(input.transferredAt, 5);
  const rows = await runner.query(
    `SELECT id
     FROM mile_transfers
     WHERE organization_id = $1
       AND from_account_id = $2
       AND to_account_id = $3
       AND points_sent = $4
       AND points_received = $5
       AND COALESCE(transfer_fee_cents, 0) = $6
       AND COALESCE(bonus_percentage, 0) = $7
       AND COALESCE(description, '') = COALESCE($8, '')
       AND status = 'completed'
       AND created_at >= $9
     LIMIT 1`,
    [
      input.organizationId,
      input.fromAccountId,
      input.toAccountId,
      input.pointsSent,
      input.pointsReceived,
      input.feeCents,
      input.bonusPercent,
      input.description ?? null,
      windowStart,
    ],
  );

  const duplicate = (rows.rows as any[])[0];

  if (duplicate) {
    reportFinancialEvent("DUPLICATE_OPERATION_BLOCKED", "Duplicate transfer blocked", {
      operation: "transfer",
      organizationId: input.organizationId,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
    });
    return true;
  }

  return false;
}
