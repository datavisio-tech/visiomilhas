import { resolveCurrentBetterAuthSessionContext } from "./better-auth-session";
import type { SessionContext } from "./auth-context";
import {
  resolveSimulatedSessionContext,
  type SessionContextResolver,
  type SimulatedSessionInput,
} from "./fake-auth-adapter";
import {
  incrementAuthMetric,
  recordAuthFallbackUsage,
  reportAuthEvent,
  resolveBrowserContextTag,
  type AuthFallbackReason,
} from "./auth-observability";

export type ControlledSessionSource = string;
export type { SessionContextResolver } from "./fake-auth-adapter";

export type ControlledSessionContextInput = SimulatedSessionInput & {
  requestHeaders?: Headers;
  allowFallback?: boolean;
  source?: ControlledSessionSource;
  resolveFallbackSessionContext?: SessionContextResolver;
  resolveBetterAuthSessionContext?: typeof resolveCurrentBetterAuthSessionContext;
};

export type ControlledSessionResolutionDependencies = {
  requestHeaders?: Headers;
  allowFallback?: boolean;
  source?: ControlledSessionSource;
  resolveFallbackSessionContext?: SessionContextResolver;
  resolveBetterAuthSessionContext?: typeof resolveCurrentBetterAuthSessionContext;
};

function resolveFakeAuthFallbackEnabled(): boolean {
  const rawValue =
    process.env.VISIOMILHEIRO_FAKE_AUTH_FALLBACK?.trim().toLowerCase();

  if (rawValue === "1" || rawValue === "true" || rawValue === "on") {
    return true;
  }

  if (rawValue === "0" || rawValue === "false" || rawValue === "off") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export async function resolveControlledSessionContext(
  input: ControlledSessionContextInput = {},
  dependencies: ControlledSessionResolutionDependencies = {},
): Promise<SessionContext | null> {
  const allowFallback =
    dependencies.allowFallback ??
    input.allowFallback ??
    resolveFakeAuthFallbackEnabled();
  const resolveBetterAuthSessionContext =
    dependencies.resolveBetterAuthSessionContext ??
    input.resolveBetterAuthSessionContext ??
    resolveCurrentBetterAuthSessionContext;
  const resolveFallbackSessionContext =
    dependencies.resolveFallbackSessionContext ??
    input.resolveFallbackSessionContext ??
    resolveSimulatedSessionContext;
  const requestHeaders =
    dependencies.requestHeaders ?? input.requestHeaders ?? undefined;
  const source = dependencies.source ?? input.source ?? "unknown";
  let fallbackReason: AuthFallbackReason | null = null;

  try {
    const sessionContext =
      await resolveBetterAuthSessionContext(requestHeaders);

    if (sessionContext) {
      incrementAuthMetric("better_auth_sessions_valid");
      reportAuthEvent({
        level: "info",
        code: "SESSION_REFRESH_SUCCESS",
        message: "Better Auth session refreshed successfully",
        details: {
          source,
          allowFallback,
          onboardingStage: sessionContext.ownership.organizationId ? "ready" : "required",
          recoveryStage: sessionContext.ownership.organizationId ? "stable" : "recovery-needed",
          ownershipState: sessionContext.ownership.organizationId ? "owned" : "missing",
          browserContext: resolveBrowserContextTag(requestHeaders?.get("user-agent")),
        },
      });
      return sessionContext;
    }

    fallbackReason = "session-empty";

    reportAuthEvent({
      level: "warn",
      code: "SESSION_RESOLUTION_EMPTY",
      message: "Better Auth returned no session; evaluating fallback",
      details: {
        source,
        allowFallback,
      },
    });
  } catch (error) {
    incrementAuthMetric("unauthorized");
    fallbackReason = "session-error";
    reportAuthEvent({
      level: "warn",
      code: "SESSION_RESOLUTION_FAILED",
      message: "Better Auth session resolution failed",
      details: {
        source,
        allowFallback,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  if (!allowFallback) {
    return null;
  }

  if (!fallbackReason) {
    return null;
  }

  recordAuthFallbackUsage({
    source,
    reason: fallbackReason,
    occurredAt: new Date().toISOString(),
    accountId: input.accountId ?? null,
    organizationId: input.organizationId ?? null,
  });

  return resolveFallbackSessionContext(input);
}
