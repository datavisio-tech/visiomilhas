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
  | "BALANCE_ABOVE_ALLOWED_DETECTED";

export type FinancialEventCode =
  | "BALANCE_RECONCILIATION_SUCCESS"
  | "BALANCE_RECONCILIATION_WARNING"
  | "NEGATIVE_BALANCE_DETECTED"
  | "ORPHAN_LOT_DETECTED"
  | "FIFO_RUNTIME_RECOVERY"
  | "DUPLICATE_OPERATION_BLOCKED";

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

function isNotNullish(value: unknown): boolean {
  return value !== null && value !== undefined;
}

function floorWindowStart(occurredAt: Date, windowMinutes = 5): Date {
  return new Date(occurredAt.getTime() - windowMinutes * 60 * 1000);
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

  if (input.accountId) params.push(input.accountId);

  const accountsRes = await runner.query(
    `SELECT id, current_points_balance, current_cost_basis_cents, current_avg_cost_per_thousand_cents
     FROM program_accounts
     WHERE organization_id = $1${accountFilter}`,
    params,
  );

  const lotsRes = await runner.query(
    `SELECT id, account_id, acquired_points, remaining_points, organization_id
     FROM mile_point_lots
     WHERE organization_id = $1`,
    [input.organizationId],
  );

  const orphanLotsRes = await runner.query(
    `SELECT l.id, l.account_id
     FROM mile_point_lots l
     LEFT JOIN program_accounts a ON a.id = l.account_id
     WHERE l.organization_id = $1 AND a.id IS NULL`,
    [input.organizationId],
  );

  const issues: FinancialIntegrityIssue[] = [];
  const lotsByAccount = new Map<number, any[]>();

  for (const lot of lotsRes.rows) {
    if (!isNotNullish(lot.account_id)) continue;
    const accountLots = lotsByAccount.get(lot.account_id) ?? [];
    accountLots.push(lot);
    lotsByAccount.set(lot.account_id, accountLots);
  }

  for (const account of accountsRes.rows) {
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
