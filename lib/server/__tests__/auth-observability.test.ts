import { describe, expect, it, beforeEach } from "vitest";

import {
  getAuthFallbackHotspots,
  getAuthFallbackSnapshot,
  getAuthOperationalMatrix,
  getOnboardingMetricSnapshot,
  recordAuthFallbackUsage,
  reportOnboardingEvent,
  resetAuthObservabilityState,
} from "../auth-observability";

describe("auth-observability", () => {
  beforeEach(() => {
    resetAuthObservabilityState();
  });

  it("tracks fallback usage by source, reason and temporal order", () => {
    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-empty",
      occurredAt: "2026-05-24T12:00:00.000Z",
      accountId: 10,
      organizationId: 1,
    });

    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-error",
      occurredAt: "2026-05-24T12:05:00.000Z",
      accountId: 10,
      organizationId: 1,
    });

    const snapshot = getAuthFallbackSnapshot();

    expect(snapshot.bySource["dashboard.page"]).toBe(2);
    expect(snapshot.byReason["session-empty"]).toBe(1);
    expect(snapshot.byReason["session-error"]).toBe(1);
    expect(snapshot.bySourceAndReason["dashboard.page::session-empty"]).toBe(
      1,
    );
    expect(snapshot.bySourceAndReason["dashboard.page::session-error"]).toBe(
      1,
    );
    expect(snapshot.firstSeenBySource["dashboard.page"]).toBe(
      "2026-05-24T12:00:00.000Z",
    );
    expect(snapshot.lastSeenBySource["dashboard.page"]).toBe(
      "2026-05-24T12:05:00.000Z",
    );
  });

  it("returns fallback hotspots ordered by frequency", () => {
    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-empty",
      occurredAt: "2026-05-24T12:00:00.000Z",
    });
    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-empty",
      occurredAt: "2026-05-24T12:01:00.000Z",
    });
    recordAuthFallbackUsage({
      source: "purchases.page",
      reason: "session-error",
      occurredAt: "2026-05-24T12:02:00.000Z",
    });

    const hotspots = getAuthFallbackHotspots(2);

    expect(hotspots).toHaveLength(2);
    expect(hotspots[0]).toMatchObject({
      source: "dashboard.page",
      count: 2,
      firstSeenAt: "2026-05-24T12:00:00.000Z",
      lastSeenAt: "2026-05-24T12:01:00.000Z",
    });
    expect(hotspots[1]).toMatchObject({
      source: "purchases.page",
      count: 1,
      firstSeenAt: "2026-05-24T12:02:00.000Z",
      lastSeenAt: "2026-05-24T12:02:00.000Z",
    });
  });

  it("computes a stabilization matrix from fallback and valid session counts", () => {
    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-empty",
      occurredAt: "2026-05-24T12:00:00.000Z",
    });
    recordAuthFallbackUsage({
      source: "dashboard.page",
      reason: "session-error",
      occurredAt: "2026-05-24T12:01:00.000Z",
    });

    const matrix = getAuthOperationalMatrix();

    expect(matrix.fallbackCount).toBe(2);
    expect(matrix.fallbackRate).toBe(1);
    expect(matrix.readinessScore).toBe(0);
    expect(matrix.stabilizationLevel).toBe("transitional");
    expect(matrix.hotspots[0].source).toBe("dashboard.page");
  });

  it("tracks onboarding telemetry metrics for started, completed, failed and recovery", () => {
    reportOnboardingEvent("ONBOARDING_STARTED", {
      source: "api.onboarding",
      stage: "start",
      state: "not-started",
      flowStage: "staging-validation",
    });
    reportOnboardingEvent("ONBOARDING_RECOVERY", {
      source: "api.onboarding",
      stage: "recovery",
      state: "partial",
      flowStage: "staging-validation",
    });
    reportOnboardingEvent("ONBOARDING_DUPLICATE_PREVENTED", {
      source: "api.onboarding",
      stage: "dedupe",
      state: "ready",
      flowStage: "staging-validation",
    });
    reportOnboardingEvent("ONBOARDING_COMPLETED", {
      source: "api.onboarding",
      stage: "completed",
      state: "ready",
      flowStage: "completed",
    });
    reportOnboardingEvent("ONBOARDING_FAILED", {
      source: "api.onboarding",
      stage: "failed",
      reason: "boom",
      state: "partial",
      flowStage: "failed",
    });

    expect(getOnboardingMetricSnapshot()).toEqual({
      onboarding_started: 1,
      onboarding_completed: 1,
      onboarding_failed: 1,
      onboarding_recovery: 1,
      onboarding_duplicate_prevented: 1,
    });
  });
});
