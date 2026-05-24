import { requireAuth, type SessionContext } from "./auth-context";
import { resolveControlledSessionContext } from "./controlled-session";
import { type SessionContextResolver } from "./controlled-session";

export type ReadScope = {
  sessionContext: SessionContext;
  organizationId: number;
  userId: string;
};

export type ReadScopeResolutionOptions = {
  allowFallback?: boolean;
  source?: string;
  resolveFallbackSessionContext?: SessionContextResolver;
};

export async function resolveReadScope(
  sessionContext?: SessionContext | null,
  options: ReadScopeResolutionOptions = {},
): Promise<ReadScope> {
  const source = options.source ?? "read-scope";
  const allowFallback = options.allowFallback ?? false;

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
    throw new Error("Read scope requires an organization id");
  }

  return {
    sessionContext: resolvedSession,
    organizationId,
    userId: auth.userId,
  };
}
