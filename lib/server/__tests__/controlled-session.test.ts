import { describe, expect, it, vi } from "vitest";

import { buildSessionContextFromBetterAuthSession } from "../better-auth-session";
import { resolveControlledSessionContext } from "../controlled-session";
import {
  getAuthFallbackSnapshot,
  resetAuthObservabilityState,
} from "../auth-observability";

describe("resolveControlledSessionContext", () => {
  it("records fallback origin and reason when Better Auth returns no session", async () => {
    resetAuthObservabilityState();

    const betterAuthResolver = vi.fn(async () => null);
    const fallbackResolver = vi.fn(async () =>
      buildSessionContextFromBetterAuthSession({
        user: { id: "fallback-user", provider: "internal" },
        session: { id: "fallback-session" },
      }),
    );

    const sessionContext = await resolveControlledSessionContext(
      { accountId: 10, source: "purchase.action" },
      {
        allowFallback: true,
        resolveBetterAuthSessionContext: betterAuthResolver,
        resolveFallbackSessionContext: fallbackResolver as any,
      },
    );

    const snapshot = getAuthFallbackSnapshot();

    expect(sessionContext?.auth.userId).toBe("fallback-user");
    expect(snapshot.bySource["purchase.action"]).toBe(1);
    expect(snapshot.byReason["session-empty"]).toBe(1);
    expect(snapshot.lastSeenBySource["purchase.action"]).toMatch(/T/);
  });

  it("returns the Better Auth session when it exists", async () => {
    resetAuthObservabilityState();

    const betterAuthResolver = vi.fn(async () =>
      buildSessionContextFromBetterAuthSession({
        user: {
          id: "user-real",
          email: "real@example.com",
          provider: "google",
        },
        session: {
          id: "session-real",
        },
      }),
    );
    const fallbackResolver = vi.fn();

    const sessionContext = await resolveControlledSessionContext(
      { accountId: 10 },
      {
        allowFallback: true,
        resolveBetterAuthSessionContext: betterAuthResolver,
        resolveFallbackSessionContext: fallbackResolver as any,
      },
    );

    expect(sessionContext?.auth.userId).toBe("user-real");
    expect(betterAuthResolver).toHaveBeenCalledTimes(1);
    expect(fallbackResolver).not.toHaveBeenCalled();
  });

  it("records session-error fallback when Better Auth throws and fallback is allowed", async () => {
    resetAuthObservabilityState();

    const betterAuthResolver = vi.fn(async () => {
      throw new Error("cookie missing");
    });
    const fallbackResolver = vi.fn(async () =>
      buildSessionContextFromBetterAuthSession({
        user: { id: "fallback-user", provider: "internal" },
        session: { id: "fallback-session" },
      }),
    );

    const sessionContext = await resolveControlledSessionContext(
      { accountId: 10, userId: "demo-user-10", source: "sale.action" },
      {
        allowFallback: true,
        resolveBetterAuthSessionContext: betterAuthResolver,
        resolveFallbackSessionContext: fallbackResolver as any,
      },
    );

    const snapshot = getAuthFallbackSnapshot();

    expect(sessionContext?.auth.userId).toBe("fallback-user");
    expect(betterAuthResolver).toHaveBeenCalledTimes(1);
    expect(fallbackResolver).toHaveBeenCalledTimes(1);
    expect(snapshot.bySource["sale.action"]).toBe(1);
    expect(snapshot.byReason["session-error"]).toBe(1);
  });

  it("returns null when fallback is disabled and Better Auth fails", async () => {
    resetAuthObservabilityState();

    const betterAuthResolver = vi.fn(async () => {
      throw new Error("cookie missing");
    });
    const fallbackResolver = vi.fn();

    const sessionContext = await resolveControlledSessionContext(
      { accountId: 10 },
      {
        allowFallback: false,
        resolveBetterAuthSessionContext: betterAuthResolver,
        resolveFallbackSessionContext: fallbackResolver as any,
      },
    );

    expect(sessionContext).toBeNull();
    expect(betterAuthResolver).toHaveBeenCalledTimes(1);
    expect(fallbackResolver).not.toHaveBeenCalled();
  });
});
