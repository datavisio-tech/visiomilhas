export type AuthEventLevel = "info" | "warn" | "error";

export type AuthEventCode =
  | "SESSION_RESOLUTION_FAILED"
  | "SESSION_RESOLUTION_FALLBACK"
  | "SESSION_RESOLUTION_EMPTY"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "OAUTH_CALLBACK_FAILED"
  | "OAUTH_REDIRECT_LOOP"
  | "OAUTH_RUNTIME_STAGING_CHECK"
  | "OAUTH_REDIRECT_URI_MISMATCH"
  | "OAUTH_CALLBACK_SUCCESS"
  | "SESSION_PERSISTENCE_CONFIRMED"
  | "OAUTH_REAL_LOGIN_SUCCESS"
  | "OAUTH_REAL_LOGOUT_SUCCESS"
  | "SESSION_REOPEN_SUCCESS"
  | "OAUTH_E2E_SUCCESS"
  | "REAL_USER_SESSION_VALIDATED"
  | "REAL_ONBOARDING_COMPLETED"
  | "AUTH_BOOTSTRAP_FAILED"
  | "AUTH_ENV_INVALID"
  | "OAUTH_RUNTIME_ERROR"
  | "AUTH_ADAPTER_SCHEMA_INVALID"
  | "AUTH_ADAPTER_RUNTIME_ERROR"
  | "AUTH_DB_MIGRATION_REQUIRED"
  | "AUTH_DB_TABLE_MISSING"
  | "AUTH_SESSION_PERSISTENCE_FAILED";

export type OnboardingEventCode =
  | "ONBOARDING_STARTED"
  | "ONBOARDING_COMPLETED"
  | "ONBOARDING_FAILED"
  | "ONBOARDING_RECOVERY"
  | "ONBOARDING_DUPLICATE_PREVENTED"
  | "ONBOARDING_IDEMPOTENT_RECOVERY";

export type RuntimeEnvironmentTag =
  | "development"
  | "staging"
  | "production"
  | "test"
  | "unknown";

export type BrowserContextTag =
  | "desktop"
  | "mobile"
  | "tablet"
  | "bot"
  | "unknown";

export type AuthEvent = {
  level: AuthEventLevel;
  code: AuthEventCode;
  message: string;
  details?: Record<string, unknown>;
};

export type AuthMetricName =
  | "better_auth_sessions_valid"
  | "session_fallback_used"
  | "unauthorized"
  | "forbidden";

export type OnboardingMetricName =
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_failed"
  | "onboarding_recovery"
  | "onboarding_duplicate_prevented";

export type AuthFallbackReason =
  | "session-empty"
  | "session-error"
  | "fallback-disabled";

export type AuthFallbackUsage = {
  source: string;
  reason: AuthFallbackReason;
  occurredAt: string;
  accountId?: number | null;
  organizationId?: number | null;
};

export type AuthFallbackSnapshot = {
  bySource: Record<string, number>;
  byReason: Record<AuthFallbackReason, number>;
  bySourceAndReason: Record<string, number>;
  firstSeenBySource: Record<string, string>;
  lastSeenBySource: Record<string, string>;
};

export type AuthFallbackHotspot = {
  source: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type AuthOperationalStabilizationLevel =
  | "transitional"
  | "stabilized"
  | "hardened";

export type AuthOperationalMatrix = {
  readinessScore: number;
  fallbackRate: number;
  fallbackCount: number;
  stabilizedCoverage: number;
  hardenedCoverage: number;
  stabilizationLevel: AuthOperationalStabilizationLevel;
  hotspots: AuthFallbackHotspot[];
};

const authMetricCounts: Record<AuthMetricName, number> = {
  better_auth_sessions_valid: 0,
  session_fallback_used: 0,
  unauthorized: 0,
  forbidden: 0,
};

const onboardingMetricCounts: Record<OnboardingMetricName, number> = {
  onboarding_started: 0,
  onboarding_completed: 0,
  onboarding_failed: 0,
  onboarding_recovery: 0,
  onboarding_duplicate_prevented: 0,
};

const fallbackUsageCountsBySource = new Map<string, number>();
const fallbackUsageCountsByReason = new Map<AuthFallbackReason, number>();
const fallbackUsageCountsBySourceAndReason = new Map<string, number>();
const fallbackUsageFirstSeenBySource = new Map<string, string>();
const fallbackUsageLastSeenBySource = new Map<string, string>();

export function incrementAuthMetric(metricName: AuthMetricName): void {
  authMetricCounts[metricName] += 1;
}

export function getAuthMetricSnapshot(): Record<AuthMetricName, number> {
  return { ...authMetricCounts };
}

export function resolveRuntimeEnvironmentTag(): RuntimeEnvironmentTag {
  const explicit = process.env.VERCEL_ENV?.trim().toLowerCase();

  if (
    explicit === "production" ||
    explicit === "preview" ||
    explicit === "development"
  ) {
    return explicit === "preview" ? "staging" : explicit;
  }

  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  if (
    nodeEnv === "production" ||
    nodeEnv === "development" ||
    nodeEnv === "test"
  ) {
    return nodeEnv;
  }

  return "unknown";
}

export function resolveBrowserContextTag(
  userAgent?: string | null,
): BrowserContextTag {
  const normalized = userAgent?.trim().toLowerCase();

  if (!normalized) return "unknown";
  if (
    normalized.includes("bot") ||
    normalized.includes("crawler") ||
    normalized.includes("spider")
  ) {
    return "bot";
  }
  if (normalized.includes("ipad") || normalized.includes("tablet")) {
    return "tablet";
  }
  if (
    normalized.includes("mobi") ||
    normalized.includes("android") ||
    normalized.includes("iphone")
  ) {
    return "mobile";
  }

  return "desktop";
}

export function incrementOnboardingMetric(
  metricName: OnboardingMetricName,
): void {
  onboardingMetricCounts[metricName] += 1;
}

export function getOnboardingMetricSnapshot(): Record<
  OnboardingMetricName,
  number
> {
  return { ...onboardingMetricCounts };
}

export function recordAuthFallbackUsage(usage: AuthFallbackUsage): void {
  incrementAuthMetric("session_fallback_used");
  const sourceAndReasonKey = `${usage.source}::${usage.reason}`;

  fallbackUsageCountsBySource.set(
    usage.source,
    (fallbackUsageCountsBySource.get(usage.source) ?? 0) + 1,
  );
  fallbackUsageCountsByReason.set(
    usage.reason,
    (fallbackUsageCountsByReason.get(usage.reason) ?? 0) + 1,
  );
  fallbackUsageLastSeenBySource.set(usage.source, usage.occurredAt);
  if (!fallbackUsageFirstSeenBySource.has(usage.source)) {
    fallbackUsageFirstSeenBySource.set(usage.source, usage.occurredAt);
  }
  fallbackUsageCountsBySourceAndReason.set(
    sourceAndReasonKey,
    (fallbackUsageCountsBySourceAndReason.get(sourceAndReasonKey) ?? 0) + 1,
  );

  reportAuthEvent({
    level: "warn",
    code: "SESSION_RESOLUTION_FALLBACK",
    message: "Using simulated auth session fallback",
    details: {
      source: usage.source,
      reason: usage.reason,
      occurredAt: usage.occurredAt,
      accountId: usage.accountId ?? null,
      organizationId: usage.organizationId ?? null,
    },
  });
}

export function getAuthFallbackSnapshot(): AuthFallbackSnapshot {
  return {
    bySource: Object.fromEntries(fallbackUsageCountsBySource.entries()),
    byReason: {
      "session-empty": fallbackUsageCountsByReason.get("session-empty") ?? 0,
      "session-error": fallbackUsageCountsByReason.get("session-error") ?? 0,
      "fallback-disabled":
        fallbackUsageCountsByReason.get("fallback-disabled") ?? 0,
    },
    bySourceAndReason: Object.fromEntries(
      fallbackUsageCountsBySourceAndReason.entries(),
    ),
    firstSeenBySource: Object.fromEntries(
      fallbackUsageFirstSeenBySource.entries(),
    ),
    lastSeenBySource: Object.fromEntries(
      fallbackUsageLastSeenBySource.entries(),
    ),
  };
}

export function getAuthFallbackHotspots(limit = 5): AuthFallbackHotspot[] {
  const snapshot = getAuthFallbackSnapshot();

  return Object.entries(snapshot.bySource)
    .map(([source, count]) => ({
      source,
      count,
      firstSeenAt: snapshot.firstSeenBySource[source] ?? "",
      lastSeenAt: snapshot.lastSeenBySource[source] ?? "",
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.source.localeCompare(right.source),
    )
    .slice(0, limit);
}

export function getAuthOperationalMatrix(): AuthOperationalMatrix {
  const metrics = getAuthMetricSnapshot();
  const fallbackCount = metrics.session_fallback_used;
  const validSessionCount = metrics.better_auth_sessions_valid;
  const totalObserved = validSessionCount + fallbackCount;
  const fallbackRate = totalObserved > 0 ? fallbackCount / totalObserved : 0;
  const readinessScore =
    totalObserved > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((validSessionCount / totalObserved) * 100)),
        )
      : 0;
  const stabilizationLevel: AuthOperationalStabilizationLevel =
    totalObserved === 0
      ? "transitional"
      : fallbackCount === 0
        ? "hardened"
        : fallbackRate <= 0.05
          ? "stabilized"
          : "transitional";

  return {
    readinessScore,
    fallbackRate,
    fallbackCount,
    stabilizedCoverage: totalObserved > 0 ? 1 - fallbackRate : 0,
    hardenedCoverage: totalObserved > 0 && fallbackCount === 0 ? 1 : 0,
    stabilizationLevel,
    hotspots: getAuthFallbackHotspots(5),
  };
}

export function resetAuthObservabilityState(): void {
  authMetricCounts.better_auth_sessions_valid = 0;
  authMetricCounts.session_fallback_used = 0;
  authMetricCounts.unauthorized = 0;
  authMetricCounts.forbidden = 0;
  fallbackUsageCountsBySource.clear();
  fallbackUsageCountsByReason.clear();
  fallbackUsageCountsBySourceAndReason.clear();
  fallbackUsageFirstSeenBySource.clear();
  fallbackUsageLastSeenBySource.clear();
  onboardingMetricCounts.onboarding_started = 0;
  onboardingMetricCounts.onboarding_completed = 0;
  onboardingMetricCounts.onboarding_failed = 0;
  onboardingMetricCounts.onboarding_recovery = 0;
  onboardingMetricCounts.onboarding_duplicate_prevented = 0;
}

export function reportAuthEvent(event: AuthEvent): void {
  const environmentTag = resolveRuntimeEnvironmentTag();

  const payload = {
    code: event.code,
    environment: environmentTag,
    timestamp: new Date().toISOString(),
    details: {
      ...event.details,
      // Never include tokens, cookies, secrets, passwords, or full payloads
    },
  };

  if (event.level === "error") {
    console.error(`[auth:${event.code}] ${event.message}`, payload);
    return;
  }

  if (event.level === "warn") {
    console.warn(`[auth:${event.code}] ${event.message}`, payload);
    return;
  }

  console.info(`[auth:${event.code}] ${event.message}`, payload);
}

export function reportOnboardingEvent(
  code: OnboardingEventCode,
  details: {
    source: string;
    stage?: string;
    fallback?: boolean;
    reason?: string;
    state?: string;
    flowStage?: string;
    severity?: AuthEventLevel;
    runtimeState?: string;
    retryState?: string;
    recoveryState?: string;
    environmentTag?: RuntimeEnvironmentTag;
    browserContext?: BrowserContextTag;
  },
): void {
  // increment lightweight metrics
  switch (code) {
    case "ONBOARDING_STARTED":
      incrementOnboardingMetric("onboarding_started");
      break;
    case "ONBOARDING_COMPLETED":
      incrementOnboardingMetric("onboarding_completed");
      break;
    case "ONBOARDING_FAILED":
      incrementOnboardingMetric("onboarding_failed");
      break;
    case "ONBOARDING_RECOVERY":
      incrementOnboardingMetric("onboarding_recovery");
      break;
    case "ONBOARDING_DUPLICATE_PREVENTED":
      incrementOnboardingMetric("onboarding_duplicate_prevented");
      break;
  }

  const payload = {
    code,
    details: {
      source: details.source,
      stage: details.stage ?? null,
      fallback: details.fallback ?? false,
      reason: details.reason ?? null,
      state: details.state ?? null,
      flowStage: details.flowStage ?? null,
      severity: details.severity ?? null,
      runtimeState: details.runtimeState ?? null,
      retryState: details.retryState ?? null,
      recoveryState: details.recoveryState ?? null,
      environmentTag: details.environmentTag ?? resolveRuntimeEnvironmentTag(),
      browserContext: details.browserContext ?? "unknown",
    },
  };

  // Log at appropriate level
  if (code === "ONBOARDING_FAILED") {
    console.error(`[auth:${code}] Onboarding failed`, payload);
    return;
  }

  if (code === "ONBOARDING_DUPLICATE_PREVENTED") {
    console.warn(`[auth:${code}] Onboarding duplicate prevented`, payload);
    return;
  }

  console.info(`[auth:${code}] Onboarding event`, payload);
}
