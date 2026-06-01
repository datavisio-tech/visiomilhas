import { describe, expect, it, vi } from "vitest";

vi.mock("../onboarding", () => ({
  ensureGlobalUser: vi.fn(async () => 123),
  ensureInitialOrganizationAndAccount: vi.fn(async () => ({
    organizationId: 77,
    accountId: 55,
    programId: 11,
    status: "created" as const,
  })),
}));

import { buildSessionContextFromBetterAuthSession } from "../better-auth-session";
import { resolveBetterAuthSessionContext } from "../better-auth-session";
import { resolveBetterAuthEnvironment } from "../better-auth-config";

describe("resolveBetterAuthEnvironment", () => {
  it("normalizes base URL and trusted origins", () => {
    const env = resolveBetterAuthEnvironment({
      BETTER_AUTH_SECRET: "test-secret",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      BETTER_AUTH_URL: "https://app.visiochat.cloud/auth",
      APP_URL: "https://app.visiochat.cloud",
      NEXT_PUBLIC_APP_URL: "https://app.visiochat.cloud/",
    });

    expect(env.baseURL).toBe("https://app.visiochat.cloud/auth");
    expect(env.trustedOrigins).toEqual([
      "https://app.visiochat.cloud",
      "http://localhost:3000",
    ]);
  });

  it("prefers the dev server port when PORT is set", () => {
    const env = resolveBetterAuthEnvironment({
      BETTER_AUTH_SECRET: "test-secret",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      PORT: "3001",
      APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    expect(env.baseURL).toBe("http://localhost:3001");
    expect(env.trustedOrigins).toEqual([
      "http://localhost:3001",
      "http://localhost:3000",
    ]);
  });

  it("requires auth and Google env vars", () => {
    expect(() =>
      resolveBetterAuthEnvironment({
        APP_URL: "https://app.visiochat.cloud",
      }),
    ).toThrow(
      "Missing required environment variables: BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET",
    );
  });
});

describe("buildSessionContextFromBetterAuthSession", () => {
  it("maps a Better Auth session into the app session contract", () => {
    const sessionContext = buildSessionContextFromBetterAuthSession({
      user: {
        id: "user-123",
        email: "user@example.com",
        provider: "google",
      },
      session: {
        id: "session-123",
        createdAt: "2026-05-23T10:00:00.000Z",
        expiresAt: "2026-05-24T10:00:00.000Z",
      },
    });

    expect(sessionContext?.auth.userId).toBe("user-123");
    expect(sessionContext?.auth.email).toBe("user@example.com");
    expect(sessionContext?.auth.authProvider).toBe("google");
    expect(sessionContext?.auth.sessionId).toBe("session-123");
    expect(sessionContext?.auth.issuedAt?.toISOString()).toBe(
      "2026-05-23T10:00:00.000Z",
    );
    expect(sessionContext?.auth.expiresAt?.toISOString()).toBe(
      "2026-05-24T10:00:00.000Z",
    );
  });

  it("returns null when the session does not have a user id", () => {
    expect(buildSessionContextFromBetterAuthSession(null)).toBeNull();
    expect(
      buildSessionContextFromBetterAuthSession({
        user: { email: "user@example.com" },
      }),
    ).toBeNull();
  });

  it("hydrates organization ownership when onboarding is provisioned", async () => {
    const sessionContext = await resolveBetterAuthSessionContext(
      {
        api: {
          getSession: async () => ({
            user: {
              id: "user-123",
              email: "user@example.com",
              provider: "google",
            },
            session: {
              id: "session-123",
            },
          }),
        },
      },
      new Headers(),
    );

    expect(sessionContext?.auth.userId).toBe("user-123");
    expect(sessionContext?.ownership.organizationId).toBe(77);
    expect(sessionContext?.ownership.accountId).toBe(55);
    expect(sessionContext?.ownership.ownsOrganizationScope).toBe(true);
  });

  it("rejects stale sessions before reuse", async () => {
    const sessionContext = await resolveBetterAuthSessionContext(
      {
        api: {
          getSession: async () => ({
            user: {
              id: "user-expired",
              email: "expired@example.com",
              provider: "google",
            },
            session: {
              id: "session-expired",
              expiresAt: new Date(Date.now() - 60 * 1000),
            },
          }),
        },
      },
      new Headers(),
    );

    expect(sessionContext).toBeNull();
  });
});
