import { headers } from "next/headers";

import {
  buildAuthContext,
  buildSessionContext,
  buildOwnershipContext,
  type SessionContext,
} from "./auth-context";
import { ensureGlobalUser } from "./onboarding";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "./auth-observability";

type BetterAuthSessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
    provider?: string | null;
    accounts?: Array<{ provider?: string | null }> | null;
  } | null;
  session?: {
    id?: string | null;
    createdAt?: Date | string | null;
    expiresAt?: Date | string | null;
    provider?: string | null;
  } | null;
  createdAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

type BetterAuthSessionResolver = {
  api: {
    // eslint-disable-next-line no-unused-vars
    getSession: (_input: { headers: Headers }) => Promise<unknown>;
  };
};

function resolveProvider(session: BetterAuthSessionLike): string | null {
  return (
    session.session?.provider ??
    session.user?.provider ??
    session.user?.accounts?.[0]?.provider ??
    null
  );
}

export function buildSessionContextFromBetterAuthSession(
  session: BetterAuthSessionLike | null | undefined,
): SessionContext | null {
  const userId = session?.user?.id?.trim();

  if (!userId) {
    return null;
  }

  const currentSession = session as BetterAuthSessionLike;

  const authContext = buildAuthContext({
    userId,
    email: currentSession.user?.email,
    authProvider: resolveProvider(currentSession) ?? "unknown",
    sessionId: currentSession.session?.id ?? null,
    isAuthenticated: true,
    issuedAt:
      currentSession.session?.createdAt ?? currentSession.createdAt ?? null,
    expiresAt:
      currentSession.session?.expiresAt ?? currentSession.expiresAt ?? null,
  });

  return buildSessionContext(authContext);
}

export async function resolveBetterAuthSessionContext(
  authInstance: BetterAuthSessionResolver,
  requestHeaders?: Headers,
): Promise<SessionContext | null> {
  const resolvedHeaders = requestHeaders ?? (await headers());
  const session = (await authInstance.api.getSession({
    headers: resolvedHeaders,
  })) as BetterAuthSessionLike | null;

  const sessionContext = buildSessionContextFromBetterAuthSession(session);

  if (!sessionContext) {
    return null;
  }

  const browserContext = resolveBrowserContextTag(
    resolvedHeaders.get("user-agent"),
  );

  const expiresAt = sessionContext.auth.expiresAt;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    reportAuthEvent({
      level: "warn",
      code: "STALE_SESSION_DETECTED",
      message: "Better Auth session is stale and will not be reused",
      details: {
        browserContext,
        sessionLifecycle: "stale",
        onboardingStage: "required",
        recoveryStage: "cleanup",
        ownershipState: "missing",
      },
    });

    reportAuthEvent({
      level: "info",
      code: "SESSION_RECOVERY_CLEANUP",
      message: "Stale session cleaned up before reuse",
      details: {
        browserContext,
        sessionLifecycle: "cleaned",
        onboardingStage: "required",
        recoveryStage: "cleanup",
        ownershipState: "missing",
      },
    });

    reportAuthEvent({
      level: "info",
      code: "STALE_SESSION_CLEANED",
      message: "Stale session cleaned before reuse",
      details: {
        browserContext,
        sessionLifecycle: "cleaned",
        onboardingStage: "required",
        recoveryStage: "cleanup",
        ownershipState: "missing",
      },
    });

    return null;
  }

  let resolvedSessionContext = sessionContext;

  // Ensure global user exists in admin DB (idempotent). Do not fail the request if DB is unavailable.
  try {
    const email = session?.user?.email;
    if (email) {
      const globalUserId = await ensureGlobalUser(
        email,
        session.user?.id ?? null,
        session.user?.provider ?? null,
      );

      // Ensure initial organization and app account exist for new users.
      if (globalUserId) {
        const { ensureInitialOrganizationAndAccount } = await import("./onboarding");
        try {
          const provision = await ensureInitialOrganizationAndAccount(
            globalUserId,
            email,
          );

          if (provision?.organizationId) {
            resolvedSessionContext = buildSessionContext(
              sessionContext.auth,
              buildOwnershipContext({
                userId: sessionContext.auth.userId,
                accountId: provision.accountId ?? null,
                organizationId: provision.organizationId,
                ownsAccount: Boolean(provision.accountId),
                ownsOrganizationScope: true,
              }),
            );
          }
        } catch (innerErr) {
          // Swallow to keep auth resilient; observability elsewhere.
          // eslint-disable-next-line no-console
          console.warn("ensureInitialOrganizationAndAccount failed:", innerErr instanceof Error ? innerErr.message : String(innerErr));
        }
      }
    }
  } catch (err) {
    // Swallow errors to keep auth resilient; observability should record this elsewhere.
    // eslint-disable-next-line no-console
    console.warn("ensureGlobalUser failed:", err instanceof Error ? err.message : String(err));
  }

  reportAuthEvent({
    level: "info",
    code: "SESSION_RESTORED",
    message: "Better Auth session restored successfully",
    details: {
      browserContext,
      sessionLifecycle: resolvedSessionContext.auth.sessionId ? "persisted" : "missing",
      onboardingStage: resolvedSessionContext.ownership.organizationId ? "ready" : "required",
      recoveryStage: resolvedSessionContext.ownership.organizationId ? "stable" : "recovery-needed",
      ownershipState: resolvedSessionContext.ownership.organizationId ? "owned" : "missing",
    },
  });

  if (resolvedSessionContext.auth.sessionId) {
    reportAuthEvent({
      level: "info",
      code: "SESSION_BROWSER_REOPEN_SUCCESS",
      message: "Browser session reopened with persisted Better Auth session",
      details: {
        browserContext,
        sessionLifecycle: "persisted",
        onboardingStage: resolvedSessionContext.ownership.organizationId ? "ready" : "required",
        recoveryStage: resolvedSessionContext.ownership.organizationId ? "stable" : "recovery-needed",
        ownershipState: resolvedSessionContext.ownership.organizationId ? "owned" : "missing",
      },
    });
  }

  return resolvedSessionContext;
}

export async function resolveCurrentBetterAuthSessionContext(
  requestHeaders?: Headers,
): Promise<SessionContext | null> {
  const { auth } = await import("../auth");

  return resolveBetterAuthSessionContext(auth, requestHeaders);
}
