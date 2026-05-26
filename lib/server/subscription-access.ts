import { headers } from "next/headers";

import { admPool } from "../../db/adm/client";
import { requireAuth, type SessionContext } from "./auth-context";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "./auth-observability";
import {
  ensureGlobalUser,
  ensureInitialOrganizationAndAccount,
} from "./onboarding";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "new"
  | "canceled"
  | "suspended";

export type SubscriptionAccessState =
  | "ACTIVE"
  | "TRIAL"
  | "NO_SUBSCRIPTION"
  | "CANCELED"
  | "SUSPENDED";

export type CommercialLifecycleState =
  | "provisioning"
  | "pending-subscribe"
  | "trial"
  | "active"
  | "canceled"
  | "suspended";

export type SubscriptionAccessContext = {
  sessionContext: SessionContext;
  globalUserId: number;
  organizationId: number;
  subscriberState: "provisioned";
  tenantState: "provisioned";
  subscriptionId: number | null;
  subscriptionStatus: SubscriptionStatus;
  accessState: SubscriptionAccessState;
  commercialLifecycleState: CommercialLifecycleState;
  planId: number | null;
  planCode: string | null;
  planName: string | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  shouldRedirectToSubscribe: boolean;
  wasProvisioned: boolean;
};

type ResolveSubscriptionAccessOptions = {
  source?: string;
  requestHeaders?: Headers;
};

type SubscriptionRow = {
  id: number;
  organization_id: number;
  plan_id: number | null;
  status: string | null;
  trial_starts_at: Date | null;
  trial_ends_at: Date | null;
};

type PlanRow = {
  id: number;
  code: string;
  name: string;
};

function normalizeSubscriptionStatus(
  status: string | null | undefined,
): SubscriptionStatus {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case "active":
      return "active";
    case "trial":
    case "trialing":
      return "trialing";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "suspended":
    case "paused":
      return "suspended";
    default:
      return "new";
  }
}

export function evaluateSubscriptionAccess(input: {
  status: SubscriptionStatus;
  trialEndsAt?: Date | null;
  wasProvisioned?: boolean;
}): Pick<
  SubscriptionAccessContext,
  "accessState" | "commercialLifecycleState" | "shouldRedirectToSubscribe"
> {
  const trialStillValid =
    Boolean(input.trialEndsAt) &&
    input.trialEndsAt instanceof Date &&
    input.trialEndsAt.getTime() > Date.now();

  switch (input.status) {
    case "active":
      return {
        accessState: "ACTIVE",
        commercialLifecycleState: "active",
        shouldRedirectToSubscribe: false,
      };
    case "trialing":
      return {
        accessState: trialStillValid ? "TRIAL" : "NO_SUBSCRIPTION",
        commercialLifecycleState: trialStillValid
          ? "trial"
          : "pending-subscribe",
        shouldRedirectToSubscribe: input.wasProvisioned
          ? true
          : !trialStillValid,
      };
    case "canceled":
      return {
        accessState: "CANCELED",
        commercialLifecycleState: "canceled",
        shouldRedirectToSubscribe: true,
      };
    case "suspended":
      return {
        accessState: "SUSPENDED",
        commercialLifecycleState: "suspended",
        shouldRedirectToSubscribe: true,
      };
    case "new":
    default:
      return {
        accessState: "NO_SUBSCRIPTION",
        commercialLifecycleState: input.wasProvisioned
          ? "provisioning"
          : "pending-subscribe",
        shouldRedirectToSubscribe: true,
      };
  }
}

async function ensurePlanOrFallback(
  client: Awaited<ReturnType<typeof admPool>> extends never ? never : any,
): Promise<PlanRow> {
  const preferredPlan = await client.query(
    `SELECT id, code, name FROM plans WHERE code = $1 LIMIT 1`,
    ["free_trial"],
  );

  if (preferredPlan.rows.length > 0) {
    return preferredPlan.rows[0] as PlanRow;
  }

  const activePlan = await client.query(
    `SELECT id, code, name FROM plans WHERE is_active = true ORDER BY id ASC LIMIT 1`,
  );

  if (activePlan.rows.length > 0) {
    return activePlan.rows[0] as PlanRow;
  }

  const insertedPlan = await client.query(
    `INSERT INTO plans (code, name, description, price_cents, currency, billing_interval, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, code, name`,
    [
      "free_trial",
      "Gratuito Trial",
      "Plano trial mínimo para acesso SaaS",
      0,
      "BRL",
      "monthly",
      true,
    ],
  );

  return insertedPlan.rows[0] as PlanRow;
}

async function loadOrCreateSubscriptionRecord(
  client: Awaited<ReturnType<typeof admPool>> extends never ? never : any,
  organizationId: number,
  wasProvisioned: boolean,
): Promise<{ row: SubscriptionRow; plan: PlanRow; inserted: boolean }> {
  const current = await client.query(
    `SELECT id, organization_id, plan_id, status, trial_starts_at, trial_ends_at FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
    [organizationId],
  );

  if (current.rows.length > 0) {
    const row = current.rows[0] as SubscriptionRow;
    const planResult = row.plan_id
      ? await client.query(
          `SELECT id, code, name FROM plans WHERE id = $1 LIMIT 1`,
          [row.plan_id],
        )
      : { rows: [] as PlanRow[] };

    return {
      row,
      plan:
        planResult.rows.length > 0
          ? (planResult.rows[0] as PlanRow)
          : await ensurePlanOrFallback(client),
      inserted: false,
    };
  }

  const plan = await ensurePlanOrFallback(client);
  const inserted = await client.query(
    `INSERT INTO subscriptions (organization_id, plan_id, status, trial_starts_at, trial_ends_at, cancel_at_period_end, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, organization_id, plan_id, status, trial_starts_at, trial_ends_at`,
    [
      organizationId,
      plan.id,
      wasProvisioned ? "new" : "new",
      null,
      null,
      false,
    ],
  );

  return {
    row: inserted.rows[0] as SubscriptionRow,
    plan,
    inserted: true,
  };
}

export async function resolveSubscriptionAccessContext(
  sessionContext: SessionContext | null | undefined,
  options: ResolveSubscriptionAccessOptions = {},
): Promise<SubscriptionAccessContext | null> {
  if (!sessionContext) {
    return null;
  }

  const auth = requireAuth(sessionContext.auth);
  const requestHeaders = options.requestHeaders ?? (await headers());
  const browserContext = resolveBrowserContextTag(
    requestHeaders.get("user-agent"),
  );

  const email = auth.email?.trim();
  if (!email) {
    reportAuthEvent({
      level: "warn",
      code: "SUBSCRIPTION_ACCESS_BLOCKED",
      message: "Subscription access blocked because the session has no email",
      details: {
        source: options.source ?? "subscription-access",
        browserContext,
        sessionLifecycle: auth.sessionId ? "persisted" : "missing",
        onboardingStage: "required",
        recoveryStage: "direct",
        accessState: "NO_SUBSCRIPTION",
        commercialLifecycleState: "provisioning",
        tenantState: "missing",
      },
    });
    return null;
  }

  const pool = admPool();
  const client = await pool.connect();

  try {
    const globalUserId = await ensureGlobalUser(
      email,
      auth.email ?? email,
      null,
    );
    if (!globalUserId) {
      return null;
    }

    const provision = await ensureInitialOrganizationAndAccount(
      globalUserId,
      email,
    );

    if (!provision?.organizationId) {
      return null;
    }

    const subscriptionResult = await loadOrCreateSubscriptionRecord(
      client,
      provision.organizationId,
      !sessionContext.ownership.organizationId,
    );

    const subscriptionStatus = normalizeSubscriptionStatus(
      subscriptionResult.row.status,
    );
    const lifecycle = evaluateSubscriptionAccess({
      status: subscriptionStatus,
      trialEndsAt: subscriptionResult.row.trial_ends_at,
      wasProvisioned: subscriptionResult.inserted,
    });

    const accessContext: SubscriptionAccessContext = {
      sessionContext,
      globalUserId,
      organizationId: provision.organizationId,
      subscriberState: "provisioned",
      tenantState: "provisioned",
      subscriptionId: subscriptionResult.row.id,
      subscriptionStatus,
      accessState: lifecycle.accessState,
      commercialLifecycleState: lifecycle.commercialLifecycleState,
      planId: subscriptionResult.plan.id,
      planCode: subscriptionResult.plan.code,
      planName: subscriptionResult.plan.name,
      trialStartsAt: subscriptionResult.row.trial_starts_at ?? null,
      trialEndsAt: subscriptionResult.row.trial_ends_at ?? null,
      shouldRedirectToSubscribe: lifecycle.shouldRedirectToSubscribe,
      wasProvisioned: subscriptionResult.inserted,
    };

    if (accessContext.accessState === "TRIAL") {
      reportAuthEvent({
        level: "info",
        code: "SUBSCRIPTION_TRIAL_ACTIVE",
        message: "Subscription trial is active",
        details: {
          source: options.source ?? "subscription-access",
          browserContext,
          sessionLifecycle: auth.sessionId ? "persisted" : "missing",
          onboardingStage: "ready",
          recoveryStage: "stable",
          accessState: accessContext.accessState,
          commercialLifecycleState: accessContext.commercialLifecycleState,
          tenantState: accessContext.tenantState,
          subscriptionState: accessContext.subscriptionStatus,
        },
      });
    }

    if (
      accessContext.accessState === "ACTIVE" ||
      accessContext.accessState === "TRIAL"
    ) {
      reportAuthEvent({
        level: "info",
        code: "SUBSCRIPTION_ACCESS_GRANTED",
        message: "Subscription access granted",
        details: {
          source: options.source ?? "subscription-access",
          browserContext,
          sessionLifecycle: auth.sessionId ? "persisted" : "missing",
          onboardingStage: "ready",
          recoveryStage: "stable",
          accessState: accessContext.accessState,
          commercialLifecycleState: accessContext.commercialLifecycleState,
          tenantState: accessContext.tenantState,
          subscriptionState: accessContext.subscriptionStatus,
        },
      });
    } else {
      reportAuthEvent({
        level: "warn",
        code:
          accessContext.accessState === "SUSPENDED"
            ? "SUBSCRIPTION_SUSPENDED"
            : "SUBSCRIPTION_ACCESS_BLOCKED",
        message: "Subscription access blocked",
        details: {
          source: options.source ?? "subscription-access",
          browserContext,
          sessionLifecycle: auth.sessionId ? "persisted" : "missing",
          onboardingStage: accessContext.wasProvisioned ? "required" : "ready",
          recoveryStage: accessContext.wasProvisioned
            ? "provisioning"
            : "blocked",
          accessState: accessContext.accessState,
          commercialLifecycleState: accessContext.commercialLifecycleState,
          tenantState: accessContext.tenantState,
          subscriptionState: accessContext.subscriptionStatus,
        },
      });

      if (accessContext.shouldRedirectToSubscribe) {
        reportAuthEvent({
          level: "info",
          code: "SUBSCRIPTION_REQUIRED_REDIRECT",
          message: "Redirecting to subscription gate",
          details: {
            source: options.source ?? "subscription-access",
            browserContext,
            sessionLifecycle: auth.sessionId ? "persisted" : "missing",
            onboardingStage: accessContext.wasProvisioned
              ? "required"
              : "ready",
            recoveryStage: accessContext.wasProvisioned
              ? "provisioning"
              : "blocked",
            accessState: accessContext.accessState,
            commercialLifecycleState: accessContext.commercialLifecycleState,
            tenantState: accessContext.tenantState,
            subscriptionState: accessContext.subscriptionStatus,
          },
        });
      }
    }

    return accessContext;
  } finally {
    client.release();
  }
}
