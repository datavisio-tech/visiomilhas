import { headers } from "next/headers";

import { admPool } from "../../db/adm/client";
import { type SessionContext, requireAuth } from "./auth-context";
import {
  evaluateSubscriptionAccess,
  type SubscriptionAccessContext,
  type SubscriptionStatus,
} from "./subscription-access";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "./auth-observability";

type AuditRow = {
  id: number;
  action: string;
  organization_id: number | null;
  user_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

export type RolloutAccessState = {
  rolloutActive: boolean;
  allowPilotAccess: boolean;
  rolloutGroup: string | null;
  internalTester: boolean;
  allowed: boolean;
};

export type RolloutSanityIssue = {
  code:
    | "organization_orphan"
    | "subscription_orphan"
    | "tenant_state_invalid"
    | "access_state_inconsistent"
    | "multiple_trials"
    | "trial_expired_active"
    | "session_stale"
    | "session_missing_ownership";
  severity: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type RolloutSanityResult = {
  issues: RolloutSanityIssue[];
  hasCriticalIssue: boolean;
};

async function loadLatestRolloutStatus(client: any): Promise<AuditRow | null> {
  const result = await client.query(
    `SELECT id, action, organization_id, user_id, metadata, created_at
     FROM admin_audit_logs
     WHERE entity_type = 'rollout' AND entity_id = 'global' AND action = 'rollout_status'
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
  );

  return result.rows[0] ?? null;
}

async function loadLatestPilotDecision(
  client: any,
  organizationId: number | null,
): Promise<AuditRow | null> {
  const result = await client.query(
    `SELECT id, action, organization_id, user_id, metadata, created_at
     FROM admin_audit_logs
     WHERE entity_type = 'rollout'
       AND action IN ('pilot_access_granted', 'pilot_access_blocked')
       AND ($1::int IS NULL OR organization_id = $1)
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [organizationId],
  );

  return result.rows[0] ?? null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePilotMetadata(metadata: Record<string, unknown> | null) {
  return {
    allowPilotAccess: asBoolean(metadata?.allow_pilot_access),
    rolloutGroup: toStringOrNull(metadata?.rollout_group),
    internalTester: asBoolean(metadata?.internal_tester),
  };
}

export async function recordRolloutStatus(input: {
  active: boolean;
  rolloutGroup?: string;
  source?: string;
  requestHeaders?: Headers;
}): Promise<void> {
  const pool = admPool();
  const client = await pool.connect();

  try {
    const browserContext = resolveBrowserContextTag(
      (input.requestHeaders ?? (await headers())).get("user-agent"),
    );

    await client.query(
      `INSERT INTO admin_audit_logs (action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, 'rollout', 'global', $2, NOW())`,
      [
        "rollout_status",
        {
          active: input.active,
          rollout_group: input.rolloutGroup ?? "pilot",
          source: input.source ?? "rollout-control",
          browser_context: browserContext,
        },
      ],
    );
  } finally {
    client.release();
  }
}

export async function recordPilotAccessDecision(input: {
  organizationId: number;
  userId: number;
  allowPilotAccess: boolean;
  rolloutGroup?: string;
  internalTester?: boolean;
  source?: string;
  requestHeaders?: Headers;
}): Promise<void> {
  const pool = admPool();
  const client = await pool.connect();

  try {
    const browserContext = resolveBrowserContextTag(
      (input.requestHeaders ?? (await headers())).get("user-agent"),
    );

    await client.query(
      `INSERT INTO admin_audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, 'rollout', $4, $5, NOW())`,
      [
        input.organizationId,
        input.userId,
        input.allowPilotAccess ? "pilot_access_granted" : "pilot_access_blocked",
        String(input.organizationId),
        {
          allow_pilot_access: input.allowPilotAccess,
          rollout_group: input.rolloutGroup ?? "pilot",
          internal_tester: input.internalTester ?? false,
          source: input.source ?? "rollout-control",
          browser_context: browserContext,
        },
      ],
    );
  } finally {
    client.release();
  }
}

export async function resolveRolloutAccess(
  sessionContext: SessionContext,
  options: { source?: string; requestHeaders?: Headers } = {},
): Promise<RolloutAccessState> {
  requireAuth(sessionContext.auth);
  const requestHeaders = options.requestHeaders ?? (await headers());
  const browserContext = resolveBrowserContextTag(
    requestHeaders.get("user-agent"),
  );

  const pool = admPool();
  const client = await pool.connect();

  try {
    const rolloutStatus = await loadLatestRolloutStatus(client);
    const rolloutActive = asBoolean(rolloutStatus?.metadata?.active);

    if (!rolloutActive) {
      return {
        rolloutActive: false,
        allowPilotAccess: true,
        rolloutGroup: null,
        internalTester: false,
        allowed: true,
      };
    }

    const pilotDecision = await loadLatestPilotDecision(
      client,
      sessionContext.ownership.organizationId ?? null,
    );
    const normalized = normalizePilotMetadata(pilotDecision?.metadata ?? null);
    const allowed = pilotDecision
      ? pilotDecision.action === "pilot_access_granted" && normalized.allowPilotAccess
      : false;

    if (allowed) {
      reportAuthEvent({
        level: "info",
        code: "PILOT_ACCESS_GRANTED",
        message: "Pilot access granted for controlled rollout",
        details: {
          source: options.source ?? "rollout-control",
          browserContext,
          rolloutGroup: normalized.rolloutGroup,
          internalTester: normalized.internalTester,
          allowPilotAccess: normalized.allowPilotAccess,
          organizationId: sessionContext.ownership.organizationId ?? null,
        },
      });
    } else {
      reportAuthEvent({
        level: "warn",
        code: "PILOT_ACCESS_BLOCKED",
        message: "Pilot access blocked for controlled rollout",
        details: {
          source: options.source ?? "rollout-control",
          browserContext,
          rolloutGroup: normalized.rolloutGroup,
          internalTester: normalized.internalTester,
          allowPilotAccess: normalized.allowPilotAccess,
          organizationId: sessionContext.ownership.organizationId ?? null,
        },
      });
    }

    return {
      rolloutActive: true,
      allowPilotAccess: normalized.allowPilotAccess,
      rolloutGroup: normalized.rolloutGroup,
      internalTester: normalized.internalTester,
      allowed,
    };
  } finally {
    client.release();
  }
}

export async function evaluateRolloutSanity(input: {
  sessionContext: SessionContext;
  accessContext?: SubscriptionAccessContext | null;
  source?: string;
  requestHeaders?: Headers;
}): Promise<RolloutSanityResult> {
  const auth = requireAuth(input.sessionContext.auth);
  const requestHeaders = input.requestHeaders ?? (await headers());
  const browserContext = resolveBrowserContextTag(
    requestHeaders.get("user-agent"),
  );
  const pool = admPool();
  const client = await pool.connect();
  const issues: RolloutSanityIssue[] = [];

  try {
    const organizationId = input.accessContext?.organizationId ?? input.sessionContext.ownership.organizationId ?? null;
    const expiresAt = auth.expiresAt;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      issues.push({
        code: "session_stale",
        severity: "warn",
        message: "Session is stale and should be recovered before reuse",
        details: { browserContext, source: input.source ?? "rollout-control" },
      });
    }

    if (!organizationId) {
      issues.push({
        code: "session_missing_ownership",
        severity: "warn",
        message: "Session has no organization ownership context",
        details: { browserContext, source: input.source ?? "rollout-control" },
      });
      return { issues, hasCriticalIssue: false };
    }

    const organizationRes = await client.query(
      `SELECT id FROM organizations WHERE id = $1 LIMIT 1`,
      [organizationId],
    );
    if (organizationRes.rows.length === 0) {
      issues.push({
        code: "organization_orphan",
        severity: "error",
        message: "Organization context is orphaned in SAAS_DB",
        details: { organizationId, browserContext },
      });
    }

    const subscriptionRes = await client.query(
      `SELECT id, status, trial_started_at, trial_expires_at, access_state, tenant_state
       FROM subscriptions
       WHERE organization_id = $1
       ORDER BY updated_at DESC, id DESC
       LIMIT 5`,
      [organizationId],
    );

    if (subscriptionRes.rows.length === 0) {
      issues.push({
        code: "subscription_orphan",
        severity: "error",
        message: "Organization has no subscription record",
        details: { organizationId, browserContext },
      });
    } else {
      const latest = subscriptionRes.rows[0] as {
        id: number;
        status: string | null;
        trial_started_at: Date | null;
        trial_expires_at: Date | null;
        access_state: string | null;
        tenant_state: string | null;
      };
      const trialingCount = subscriptionRes.rows.filter(
        (row: any) => String(row.status ?? "").toLowerCase() === "trialing",
      ).length;

      if (trialingCount > 1) {
        issues.push({
          code: "multiple_trials",
          severity: "error",
          message: "Multiple trial subscriptions detected for organization",
          details: { organizationId, trialingCount },
        });
      }

      if (
        latest.status === "trialing" &&
        latest.trial_expires_at instanceof Date &&
        latest.trial_expires_at.getTime() <= Date.now()
      ) {
        issues.push({
          code: "trial_expired_active",
          severity: "error",
          message: "Expired trial is still active in subscription state",
          details: {
            organizationId,
            subscriptionId: latest.id,
            trialExpiresAt: latest.trial_expires_at.toISOString(),
          },
        });
      }

      const tenantState = latest.tenant_state?.trim().toLowerCase();
      if (tenantState && !["active", "provisioned", "locked"].includes(tenantState)) {
        issues.push({
          code: "tenant_state_invalid",
          severity: "error",
          message: "Tenant state is invalid for controlled rollout",
          details: { organizationId, subscriptionId: latest.id, tenantState },
        });
      }

      const subscriptionStatus = latest.status?.trim().toLowerCase() as SubscriptionStatus | null;
      if (subscriptionStatus) {
        const expected = evaluateSubscriptionAccess({
          status: subscriptionStatus,
          trialEndsAt: latest.trial_expires_at,
        });
        const normalizedAccessState = latest.access_state?.trim().toUpperCase();

        if (normalizedAccessState && normalizedAccessState !== expected.accessState) {
          issues.push({
            code: "access_state_inconsistent",
            severity: "error",
            message: "Subscription access state does not match commercial lifecycle",
            details: {
              organizationId,
              subscriptionId: latest.id,
              expected: expected.accessState,
              actual: normalizedAccessState,
            },
          });
        }
      }
    }

    for (const issue of issues) {
      reportAuthEvent({
        level: issue.severity === "error" ? "error" : issue.severity === "warn" ? "warn" : "info",
        code: "COMMERCIAL_STATE_INCONSISTENT",
        message: issue.message,
        details: {
          source: input.source ?? "rollout-control",
          browserContext,
          issueCode: issue.code,
          ...issue.details,
        },
      });
    }

    if (issues.some((issue) => issue.severity === "error")) {
      reportAuthEvent({
        level: "warn",
        code: "ROLLBACK_RECOVERY_TRIGGERED",
        message: "Rollback recovery should be considered for commercial inconsistencies",
        details: {
          source: input.source ?? "rollout-control",
          browserContext,
          issueCount: issues.length,
        },
      });
    }

    return {
      issues,
      hasCriticalIssue: issues.some((issue) => issue.severity === "error"),
    };
  } finally {
    client.release();
  }
}
