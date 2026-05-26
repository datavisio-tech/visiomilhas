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
  | "expired"
  | "canceled"
  | "suspended";

export type SubscriptionAccessState =
  | "ACTIVE"
  | "TRIAL"
  | "EXPIRED"
  | "NO_SUBSCRIPTION"
  | "CANCELED"
  | "SUSPENDED";

export type CommercialLifecycleState =
  | "provisioning"
  | "pending-subscribe"
  | "trial"
  | "expired"
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
  trial_started_at: Date | null;
  trial_expires_at: Date | null;
  activated_at: Date | null;
  access_state: string | null;
  plan_type: string | null;
  tenant_state: string | null;
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
    case "expired":
      return "expired";
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
      if (!trialStillValid) {
        return {
          accessState: "EXPIRED",
          commercialLifecycleState: "expired",
          shouldRedirectToSubscribe: true,
        };
      }
      return {
        accessState: "TRIAL",
        commercialLifecycleState: "trial",
        shouldRedirectToSubscribe: false,
      };
    case "expired":
      return {
        accessState: "EXPIRED",
        commercialLifecycleState: "expired",
        shouldRedirectToSubscribe: true,
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
  planType: string,
  tenantState: string,
): Promise<{ row: SubscriptionRow; plan: PlanRow; inserted: boolean }> {
  const current = await client.query(
    `SELECT id, organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
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
    `INSERT INTO subscriptions (organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state, cancel_at_period_end, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id, organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state`,
    [
      organizationId,
      plan.id,
      wasProvisioned ? "new" : "new",
      null,
      null,
      null,
      null,
      null,
      "NO_SUBSCRIPTION",
      planType,
      tenantState,
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

    const planType = "trial";
    const tenantState = "active";
    const subscriptionResult = await loadOrCreateSubscriptionRecord(
      client,
      provision.organizationId,
      !sessionContext.ownership.organizationId,
      planType,
      tenantState,
    );

    const subscriptionStatus = normalizeSubscriptionStatus(
      subscriptionResult.row.status,
    );
    const trialStartsAt =
      subscriptionResult.row.trial_started_at ??
      subscriptionResult.row.trial_starts_at ??
      null;
    const trialEndsAt =
      subscriptionResult.row.trial_expires_at ??
      subscriptionResult.row.trial_ends_at ??
      null;
    const isTrialExpired =
      subscriptionStatus === "trialing" &&
      trialEndsAt instanceof Date &&
      trialEndsAt.getTime() <= Date.now();

    if (isTrialExpired) {
      await client.query(
        `UPDATE subscriptions SET status = $1, access_state = $2, updated_at = NOW() WHERE id = $3`,
        ["expired", "EXPIRED", subscriptionResult.row.id],
      );
    }
    const lifecycle = evaluateSubscriptionAccess({
      status: isTrialExpired ? "expired" : subscriptionStatus,
      trialEndsAt,
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
      trialStartsAt,
      trialEndsAt,
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

    if (accessContext.accessState === "EXPIRED") {
      reportAuthEvent({
        level: "warn",
        code: "TRIAL_EXPIRED",
        message: "Trial expired, subscription access blocked",
        details: {
          source: options.source ?? "subscription-access",
          browserContext,
          sessionLifecycle: auth.sessionId ? "persisted" : "missing",
          onboardingStage: "ready",
          recoveryStage: "blocked",
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
      if (
        !subscriptionResult.inserted &&
        (subscriptionResult.row.activated_at !== null ||
          subscriptionResult.row.trial_started_at !== null)
      ) {
        reportAuthEvent({
          level: "info",
          code: "COMMERCIAL_ACCESS_RECOVERED",
          message: "Commercial access recovered from persisted state",
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

      reportAuthEvent({
        level: "info",
        code: "COMMERCIAL_ACCESS_GRANTED",
        message: "Commercial access granted",
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

      reportAuthEvent({
        level: "warn",
        code: "COMMERCIAL_ACCESS_BLOCKED",
        message: "Commercial access blocked",
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

export async function activateTrialForOrganization(input: {
  organizationId: number;
  globalUserId: number;
  planCode?: string | null;
  trialDays?: number;
  source?: string;
  requestHeaders?: Headers;
}): Promise<SubscriptionAccessContext> {
  const pool = admPool();
  const client = await pool.connect();

  try {
    const planCode = input.planCode ?? "free_trial";
    const trialDays = input.trialDays ?? 15;
    const requestHeaders = input.requestHeaders ?? (await headers());
    const browserContext = resolveBrowserContextTag(
      requestHeaders.get("user-agent"),
    );

    const subscriptionRes = await client.query(
      `SELECT id, organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
      [input.organizationId],
    );

    if (!subscriptionRes.rows.length) {
      throw new Error("Subscription record not found for trial activation");
    }

    const planRes = await client.query(
      `SELECT id, code, name FROM plans WHERE code = $1 LIMIT 1`,
      [planCode],
    );

    if (!planRes.rows.length) {
      throw new Error("Plan not found for trial activation");
    }

    const now = new Date();
    const trialEndsAt = new Date(
      now.getTime() + trialDays * 24 * 60 * 60 * 1000,
    );

    const updated = await client.query(
      `UPDATE subscriptions SET plan_id = $1, status = $2, trial_starts_at = $3, trial_ends_at = $4, trial_started_at = $5, trial_expires_at = $6, activated_at = $7, access_state = $8, plan_type = $9, tenant_state = $10, updated_at = NOW() WHERE id = $11 RETURNING id, organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state`,
      [
        planRes.rows[0].id,
        "trialing",
        now,
        trialEndsAt,
        now,
        trialEndsAt,
        now,
        "TRIAL",
        planCode,
        "active",
        subscriptionRes.rows[0].id,
      ],
    );

    const accessContext: SubscriptionAccessContext = {
      sessionContext: {
        auth: {
          userId: String(input.globalUserId),
          authProvider: "internal",
          isAuthenticated: true,
        },
        ownership: {
          userId: String(input.globalUserId),
          organizationId: input.organizationId,
          ownsAccount: true,
          ownsOrganizationScope: true,
        },
      },
      globalUserId: input.globalUserId,
      organizationId: input.organizationId,
      subscriberState: "provisioned",
      tenantState: "provisioned",
      subscriptionId: updated.rows[0].id as number,
      subscriptionStatus: "trialing",
      accessState: "TRIAL",
      commercialLifecycleState: "trial",
      planId: planRes.rows[0].id as number,
      planCode: planRes.rows[0].code as string,
      planName: planRes.rows[0].name as string,
      trialStartsAt: now,
      trialEndsAt,
      shouldRedirectToSubscribe: false,
      wasProvisioned: false,
    };

    reportAuthEvent({
      level: "info",
      code: "TRIAL_ACTIVATED",
      message: "Trial activated for subscription",
      details: {
        source: input.source ?? "subscription.activate-trial",
        browserContext,
        onboardingStage: "ready",
        recoveryStage: "stable",
        accessState: accessContext.accessState,
        commercialLifecycleState: accessContext.commercialLifecycleState,
        tenantState: accessContext.tenantState,
        subscriptionState: accessContext.subscriptionStatus,
      },
    });

    reportAuthEvent({
      level: "info",
      code: "TRIAL_ACCESS_GRANTED",
      message: "Trial access granted",
      details: {
        source: input.source ?? "subscription.activate-trial",
        browserContext,
        onboardingStage: "ready",
        recoveryStage: "stable",
        accessState: accessContext.accessState,
        commercialLifecycleState: accessContext.commercialLifecycleState,
        tenantState: accessContext.tenantState,
        subscriptionState: accessContext.subscriptionStatus,
      },
    });

    reportAuthEvent({
      level: "info",
      code: "COMMERCIAL_ACCESS_GRANTED",
      message: "Commercial access granted after trial activation",
      details: {
        source: input.source ?? "subscription.activate-trial",
        browserContext,
        onboardingStage: "ready",
        recoveryStage: "stable",
        accessState: accessContext.accessState,
        commercialLifecycleState: accessContext.commercialLifecycleState,
        tenantState: accessContext.tenantState,
        subscriptionState: accessContext.subscriptionStatus,
      },
    });

    return accessContext;
  } finally {
    client.release();
  }
}
