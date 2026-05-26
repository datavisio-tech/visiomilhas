import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const release = vi.fn();

vi.mock("../../../db/adm/client", () => ({
  admPool: vi.fn(() => ({
    connect: async () => ({ query, release }),
  })),
}));

import { buildSessionContext } from "../auth-context";
import { evaluateRolloutSanity, resolveRolloutAccess } from "../rollout-control";

function buildSession(organizationId: number | null) {
  return buildSessionContext(
    {
      userId: "user-1",
      email: "user@example.com",
      authProvider: "google",
      sessionId: "session-1",
      isAuthenticated: true,
    },
    {
      userId: "user-1",
      organizationId,
      ownsAccount: true,
      ownsOrganizationScope: Boolean(organizationId),
    },
  );
}

beforeEach(() => {
  query.mockReset();
  release.mockReset();
});

describe("rollout-control", () => {
  it("allows access when rollout is inactive", async () => {
    query.mockResolvedValueOnce({ rows: [{ metadata: { active: false } }] });

    const result = await resolveRolloutAccess(buildSession(77), {
      source: "dashboard.page",
      requestHeaders: new Headers(),
    });

    expect(result.allowed).toBe(true);
    expect(result.rolloutActive).toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("blocks non-pilot orgs when rollout is active", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ metadata: { active: true } }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await resolveRolloutAccess(buildSession(77), {
      source: "dashboard.page",
      requestHeaders: new Headers(),
    });

    expect(result.rolloutActive).toBe(true);
    expect(result.allowed).toBe(false);
    expect(result.allowPilotAccess).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("flags commercial inconsistency when trial is expired but still marked active", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 77 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: "trialing",
            trial_started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            trial_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
            access_state: "TRIAL",
            tenant_state: "active",
          },
        ],
      });

    const result = await evaluateRolloutSanity({
      sessionContext: buildSession(77),
      accessContext: {
        sessionContext: buildSession(77),
        globalUserId: 1,
        organizationId: 77,
        subscriberState: "provisioned",
        tenantState: "provisioned",
        subscriptionId: 1,
        subscriptionStatus: "trialing",
        accessState: "TRIAL",
        commercialLifecycleState: "trial",
        planId: 1,
        planCode: "free_trial",
        planName: "Free Trial",
        trialStartsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        shouldRedirectToSubscribe: true,
        wasProvisioned: false,
      },
      source: "dashboard.page",
      requestHeaders: new Headers(),
    });

    expect(result.hasCriticalIssue).toBe(true);
    expect(result.issues.some((issue) => issue.code === "trial_expired_active")).toBe(true);
  });
});