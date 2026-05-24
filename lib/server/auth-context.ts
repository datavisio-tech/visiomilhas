export type AuthProvider = "google" | "email" | "internal" | "unknown";

export type AuthContext = {
  userId: string;
  email?: string;
  authProvider: AuthProvider;
  sessionId?: string;
  isAuthenticated: boolean;
  isInternalAdmin?: boolean;
  issuedAt?: Date;
  expiresAt?: Date;
};

export type AuthContextInput = {
  userId?: string | null;
  email?: string | null;
  authProvider?: string | null;
  sessionId?: string | null;
  isAuthenticated?: boolean | null;
  isInternalAdmin?: boolean | null;
  issuedAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

export type OwnershipContext = {
  userId: string;
  accountId?: number;
  organizationId?: number | null;
  ownsAccount: boolean;
  ownsOrganizationScope: boolean;
};

export type OwnershipContextInput = {
  userId?: string | null;
  accountId?: number | null;
  organizationId?: number | null;
  ownsAccount?: boolean | null;
  ownsOrganizationScope?: boolean | null;
};

export type OwnershipResourceInput = {
  accountUserId?: string | null;
  resourceUserId?: string | null;
  accountId?: number | null;
  organizationId?: number | null;
};

export type SessionContext = {
  auth: AuthContext;
  ownership: OwnershipContext;
};

export type SessionContextInput = {
  auth?: AuthContextInput | null;
  ownership?: OwnershipContextInput | null;
};

export class AuthContextError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_CONTEXT";
  readonly status: 401 | 403 | 400;

  constructor(
    message: string,
    code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_CONTEXT",
    status: 401 | 403 | 400,
  ) {
    super(message);
    this.name = "AuthContextError";
    this.code = code;
    this.status = status;
  }
}

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toOptionalInteger(
  value: number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value)) {
    throw new AuthContextError(
      "OwnershipContext numeric fields must be integers",
      "INVALID_CONTEXT",
      400,
    );
  }

  return value;
}

function toDate(
  value: Date | string | null | undefined,
  fieldName: string,
): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AuthContextError(
      `${fieldName} must be a valid date`,
      "INVALID_CONTEXT",
      400,
    );
  }

  return date;
}

export function normalizeAuthProvider(
  provider: string | null | undefined,
): AuthProvider {
  const normalized = normalizeText(provider)?.toLowerCase();

  switch (normalized) {
    case "google":
    case "google-oauth":
    case "google-oauth2":
    case "oauth-google":
      return "google";
    case "email":
    case "credentials":
    case "password":
      return "email";
    case "internal":
    case "admin":
      return "internal";
    default:
      return "unknown";
  }
}

export function buildAuthContext(input: AuthContextInput): AuthContext {
  const userId = normalizeText(input.userId);

  if (!userId) {
    throw new AuthContextError(
      "AuthContext requires a userId",
      "INVALID_CONTEXT",
      400,
    );
  }

  return {
    userId,
    email: normalizeText(input.email),
    authProvider: normalizeAuthProvider(input.authProvider),
    sessionId: normalizeText(input.sessionId),
    isAuthenticated: input.isAuthenticated ?? true,
    isInternalAdmin: input.isInternalAdmin ?? false,
    issuedAt: toDate(input.issuedAt, "issuedAt"),
    expiresAt: toDate(input.expiresAt, "expiresAt"),
  };
}

export function resolveAuthContext(
  input?: AuthContextInput | null,
): AuthContext | null {
  if (!input) {
    return null;
  }

  const userId = normalizeText(input.userId);
  if (!userId || input.isAuthenticated === false) {
    return null;
  }

  return buildAuthContext({
    ...input,
    userId,
    isAuthenticated: true,
  });
}

export function requireAuth(auth: AuthContext | null | undefined): AuthContext {
  if (!auth || !auth.isAuthenticated) {
    throw new AuthContextError(
      "Authentication required",
      "UNAUTHENTICATED",
      401,
    );
  }

  return auth;
}

export function buildOwnershipContext(
  input: OwnershipContextInput,
): OwnershipContext {
  const userId = normalizeText(input.userId);

  if (!userId) {
    throw new AuthContextError(
      "OwnershipContext requires a userId",
      "INVALID_CONTEXT",
      400,
    );
  }

  return {
    userId,
    accountId: toOptionalInteger(input.accountId),
    organizationId: toOptionalInteger(input.organizationId) ?? null,
    ownsAccount: input.ownsAccount ?? false,
    ownsOrganizationScope: input.ownsOrganizationScope ?? false,
  };
}

export function resolveOwnershipContext(
  auth: AuthContext,
  input?: OwnershipContextInput | null,
): OwnershipContext {
  const userId = normalizeText(input?.userId) ?? auth.userId;
  const organizationId = input?.organizationId ?? null;

  return buildOwnershipContext({
    userId,
    accountId: input?.accountId,
    organizationId,
    ownsAccount: input?.ownsAccount ?? userId === auth.userId,
    ownsOrganizationScope:
      input?.ownsOrganizationScope ??
      (organizationId !== null && userId === auth.userId),
  });
}

export function buildSessionContext(
  auth: AuthContext,
  ownership?: OwnershipContext | null,
): SessionContext {
  return {
    auth,
    ownership: ownership ?? resolveOwnershipContext(auth),
  };
}

export function resolveSessionContext(
  input?: SessionContextInput | null,
): SessionContext | null {
  const auth = resolveAuthContext(input?.auth);
  if (!auth) {
    return null;
  }

  return buildSessionContext(
    auth,
    input?.ownership ? resolveOwnershipContext(auth, input.ownership) : null,
  );
}

export function requireOwnership(
  input: { auth: AuthContext | null | undefined } & OwnershipResourceInput,
): AuthContext {
  const authenticated = requireAuth(input.auth);
  const ownerUserId = normalizeText(
    input.accountUserId ?? input.resourceUserId,
  );

  if (!ownerUserId) {
    throw new AuthContextError(
      "Ownership resource requires a user reference",
      "INVALID_CONTEXT",
      400,
    );
  }

  if (ownerUserId !== authenticated.userId) {
    throw new AuthContextError("Ownership required", "FORBIDDEN", 403);
  }

  return authenticated;
}

export function requireInternalAdmin(
  auth: AuthContext | null | undefined,
): AuthContext {
  const authenticated = requireAuth(auth);

  if (!authenticated.isInternalAdmin) {
    throw new AuthContextError("Internal admin required", "FORBIDDEN", 403);
  }

  return authenticated;
}
