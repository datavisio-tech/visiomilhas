import { headers } from "next/headers";

import {
  buildAuthContext,
  buildSessionContext,
  type SessionContext,
} from "./auth-context";
import { ensureGlobalUser } from "./onboarding";

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
  const session = (await authInstance.api.getSession({
    headers: requestHeaders ?? (await headers()),
  })) as BetterAuthSessionLike | null;

  const sessionContext = buildSessionContextFromBetterAuthSession(session);

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
          await ensureInitialOrganizationAndAccount(globalUserId, email);
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

  return sessionContext;
}

export async function resolveCurrentBetterAuthSessionContext(
  requestHeaders?: Headers,
): Promise<SessionContext | null> {
  const { auth } = await import("../auth");

  return resolveBetterAuthSessionContext(auth, requestHeaders);
}
