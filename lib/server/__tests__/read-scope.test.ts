import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

import { resolveReadScope } from "../read-scope";
import { buildSessionContextFromBetterAuthSession } from "../better-auth-session";
import { resolveSimulatedSessionContext } from "../fake-auth-adapter";

describe("read-scope helpers", () => {
  it("derives organization scope from the simulated server session", async () => {
    const sessionContext = resolveSimulatedSessionContext();
    const scope = await resolveReadScope(sessionContext);

    expect(scope.userId).toBe("demo-user");
    expect(scope.organizationId).toBe(1);
    expect(scope.sessionContext.auth.isAuthenticated).toBe(true);
  });

  it("rejects missing sessions by default in hardened runtime", async () => {
    await expect(resolveReadScope()).rejects.toThrow(
      "Read scope requires a session context",
    );
  });

  it("allows recovery-only fallback when explicitly enabled", async () => {
    const scope = await resolveReadScope(undefined, {
      allowFallback: true,
      source: "read-scope.recovery",
    });

    expect(scope.userId).toBe("demo-user");
    expect(scope.organizationId).toBe(1);
  });

  it("redirects to onboarding when the session has no organization scope", async () => {
    const sessionContext = buildSessionContextFromBetterAuthSession({
      user: {
        id: "user-without-org",
        email: "user@example.com",
        provider: "google",
      },
      session: {
        id: "session-without-org",
      },
    });

    await expect(
      resolveReadScope(sessionContext, {
        requestHeaders: new Headers({
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }),
      }),
    ).rejects.toThrow("redirect:/app/onboarding");
  });
});
