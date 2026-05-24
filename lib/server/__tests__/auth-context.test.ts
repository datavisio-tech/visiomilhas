import { describe, expect, it } from "vitest";
import {
  AuthContextError,
  buildAuthContext,
  buildOwnershipContext,
  buildSessionContext,
  normalizeAuthProvider,
  requireAuth,
  requireInternalAdmin,
  requireOwnership,
  resolveSessionContext,
} from "../auth-context";

describe("auth-context helpers", () => {
  it("normalizes provider aliases without depending on an auth library", () => {
    expect(normalizeAuthProvider("google-oauth2")).toBe("google");
    expect(normalizeAuthProvider("credentials")).toBe("email");
    expect(normalizeAuthProvider("custom-provider")).toBe("unknown");
  });

  it("builds and resolves contexts with normalized values", () => {
    const issuedAt = new Date("2026-05-23T10:00:00.000Z");
    const expiresAt = new Date("2026-05-23T12:00:00.000Z");

    const auth = buildAuthContext({
      userId: " user-1 ",
      email: " user@example.com ",
      authProvider: "google-oauth2",
      sessionId: " session-1 ",
      issuedAt,
      expiresAt,
    });

    expect(auth).toEqual({
      userId: "user-1",
      email: "user@example.com",
      authProvider: "google",
      sessionId: "session-1",
      isAuthenticated: true,
      isInternalAdmin: false,
      issuedAt: new Date("2026-05-23T10:00:00.000Z"),
      expiresAt: new Date("2026-05-23T12:00:00.000Z"),
    });
    expect(auth.issuedAt).not.toBe(issuedAt);
    expect(auth.expiresAt).not.toBe(expiresAt);

    const session = resolveSessionContext({
      auth: {
        userId: "user-1",
        authProvider: "google",
      },
      ownership: {
        organizationId: 42,
      },
    });

    expect(session).toEqual({
      auth: {
        userId: "user-1",
        email: undefined,
        authProvider: "google",
        sessionId: undefined,
        isAuthenticated: true,
        isInternalAdmin: false,
        issuedAt: undefined,
        expiresAt: undefined,
      },
      ownership: {
        userId: "user-1",
        accountId: undefined,
        organizationId: 42,
        ownsAccount: true,
        ownsOrganizationScope: true,
      },
    });
  });

  it("builds session contexts from explicit auth and ownership", () => {
    const auth = buildAuthContext({
      userId: "user-7",
      authProvider: "internal",
      isInternalAdmin: true,
    });

    const ownership = buildOwnershipContext({
      userId: "user-7",
      accountId: 99,
      organizationId: 123,
      ownsAccount: true,
      ownsOrganizationScope: true,
    });

    expect(buildSessionContext(auth, ownership)).toEqual({
      auth,
      ownership,
    });
  });

  it("enforces authentication, ownership and admin boundaries", () => {
    const auth = buildAuthContext({
      userId: "user-1",
      authProvider: "google",
    });

    expect(requireAuth(auth)).toBe(auth);
    expect(requireOwnership({ auth, accountUserId: "user-1" })).toBe(auth);

    expect(() => requireAuth(null)).toThrow(AuthContextError);
    expect(() => requireOwnership({ auth, accountUserId: "user-2" })).toThrow(
      AuthContextError,
    );
    expect(() => requireInternalAdmin(auth)).toThrow(AuthContextError);

    const adminAuth = buildAuthContext({
      userId: "admin-1",
      authProvider: "internal",
      isInternalAdmin: true,
    });

    expect(requireInternalAdmin(adminAuth)).toBe(adminAuth);
  });
});
