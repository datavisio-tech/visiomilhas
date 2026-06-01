import {
  buildAuthContext,
  buildSessionContext,
  type AuthContextInput,
  type SessionContext,
} from "./auth-context";

export type SimulatedSessionInput = AuthContextInput & {
  accountId?: number | null;
  organizationId?: number | null;
  source?: string;
};

function resolveDefaultOrganizationId(): number {
  const rawValue = process.env.VISIOMILHEIRO_FAKE_ORGANIZATION_ID?.trim();
  const parsedValue = rawValue ? Number(rawValue) : 0;

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function resolveSimulatedUserId(input?: SimulatedSessionInput): string | null {
  if (input?.accountId !== undefined && input?.accountId !== null) {
    return `demo-user-${input.accountId}`;
  }

  const explicitUserId = input?.userId?.trim();
  if (explicitUserId) {
    return explicitUserId;
  }

  const envUserId = process.env.VISIOMILHEIRO_FAKE_AUTH_USER_ID?.trim();
  if (envUserId) {
    return envUserId;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return "demo-user";
}

export function resolveSimulatedSessionContext(
  input: SimulatedSessionInput = {},
): SessionContext | null {
  const userId = resolveSimulatedUserId(input);
  if (!userId) {
    return null;
  }

  const auth = buildAuthContext({
    userId,
    email: input.email ?? `${userId}@local.test`,
    authProvider: input.authProvider ?? "internal",
    sessionId: input.sessionId ?? "simulated-session",
    isAuthenticated: true,
    isInternalAdmin: input.isInternalAdmin ?? false,
    issuedAt: input.issuedAt ?? new Date(),
    expiresAt: input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60),
  });

  return buildSessionContext(auth, {
    userId: auth.userId,
    accountId: input.accountId ?? undefined,
    organizationId: input.organizationId ?? resolveDefaultOrganizationId(),
    ownsAccount: true,
    ownsOrganizationScope: false,
  });
}

export type SessionContextResolver = (
  // eslint-disable-next-line no-unused-vars
  _input?: SimulatedSessionInput,
) => Promise<SessionContext | null> | SessionContext | null;
