import { describe, expect, it } from "vitest";
import { resolveReadScope } from "../read-scope";
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
});
