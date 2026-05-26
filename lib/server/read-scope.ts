import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireAuth, type SessionContext } from "./auth-context";
import { resolveControlledSessionContext } from "./controlled-session";
import { type SessionContextResolver } from "./controlled-session";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "./auth-observability";

export type ReadScope = {
  sessionContext: SessionContext;
  organizationId: number;
  userId: string;
};

export type ReadScopeResolutionOptions = {
  allowFallback?: boolean;
  source?: string;
  resolveFallbackSessionContext?: SessionContextResolver;
  onboardingRedirectPath?: string;
  requestHeaders?: Headers;
};

export async function resolveReadScope(
  sessionContext?: SessionContext | null,
  options: ReadScopeResolutionOptions = {},
): Promise<ReadScope> {
  const source = options.source ?? "read-scope";
  const allowFallback = options.allowFallback ?? false;
  const onboardingRedirectPath = options.onboardingRedirectPath ?? "/app/onboarding";

  const resolvedSession =
    sessionContext ??
    (allowFallback
      ? await resolveControlledSessionContext({
          source,
          allowFallback,
          resolveFallbackSessionContext: options.resolveFallbackSessionContext,
        })
      : null);

  if (!resolvedSession) {
    throw new Error("Read scope requires a session context");
  }

  const auth = requireAuth(resolvedSession.auth);
  const organizationId = resolvedSession.ownership.organizationId;

  if (!organizationId) {
    const requestHeaders = options.requestHeaders ?? (await headers());
    const browserContext = resolveBrowserContextTag(
      requestHeaders.get("user-agent"),
    );

    reportAuthEvent({
      level: "warn",
      code: "ONBOARDING_CONTEXT_MISSING",
      message: "Read scope missing organization context; onboarding required",
      details: {
        source,
        onboardingStage: "required",
        recoveryStage: allowFallback ? "fallback-available" : "direct",
        ownershipState: resolvedSession.ownership.ownsOrganizationScope
          ? "owned"
          : "missing",
        browserContext,
        sessionLifecycle: resolvedSession.auth.sessionId ? "persisted" : "missing",
      },
    });

    reportAuthEvent({
      level: "warn",
      code: "READ_SCOPE_ONBOARDING_RECOVERY",
      message: "Redirecting to onboarding from read scope",
      details: {
        source,
        onboardingStage: "redirect",
        recoveryStage: allowFallback ? "recovery-aware" : "required",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: resolvedSession.auth.sessionId ? "persisted" : "missing",
      },
    });

    reportAuthEvent({
      level: "info",
      code: "ONBOARDING_REQUIRED_REDIRECT",
      message: "Onboarding redirect required before read scope can continue",
      details: {
        source,
        onboardingStage: "redirect",
        recoveryStage: allowFallback ? "recovery-aware" : "direct",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: resolvedSession.auth.sessionId ? "persisted" : "missing",
        redirectPath: onboardingRedirectPath,
      },
    });

    redirect(onboardingRedirectPath);
  }

  return {
    sessionContext: resolvedSession,
    organizationId,
    userId: auth.userId,
  };
}
