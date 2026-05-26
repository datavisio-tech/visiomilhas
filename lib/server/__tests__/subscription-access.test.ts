import { describe, expect, it } from "vitest";

import { evaluateSubscriptionAccess } from "../subscription-access";

describe("evaluateSubscriptionAccess", () => {
  it("grants active access", () => {
    const result = evaluateSubscriptionAccess({ status: "active" });

    expect(result.accessState).toBe("ACTIVE");
    expect(result.shouldRedirectToSubscribe).toBe(false);
    expect(result.commercialLifecycleState).toBe("active");
  });

  it("treats a valid trial as access with warning", () => {
    const result = evaluateSubscriptionAccess({
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    expect(result.accessState).toBe("TRIAL");
    expect(result.shouldRedirectToSubscribe).toBe(false);
    expect(result.commercialLifecycleState).toBe("trial");
  });

  it("blocks new subscribers to the subscribe gate", () => {
    const result = evaluateSubscriptionAccess({
      status: "new",
      wasProvisioned: true,
    });

    expect(result.accessState).toBe("NO_SUBSCRIPTION");
    expect(result.shouldRedirectToSubscribe).toBe(true);
    expect(result.commercialLifecycleState).toBe("provisioning");
  });

  it("blocks canceled and suspended subscriptions", () => {
    const canceled = evaluateSubscriptionAccess({ status: "canceled" });
    const suspended = evaluateSubscriptionAccess({ status: "suspended" });

    expect(canceled.accessState).toBe("CANCELED");
    expect(canceled.shouldRedirectToSubscribe).toBe(true);
    expect(suspended.accessState).toBe("SUSPENDED");
    expect(suspended.shouldRedirectToSubscribe).toBe(true);
  });

  it("downgrades an expired trial to no subscription", () => {
    const result = evaluateSubscriptionAccess({
      status: "trialing",
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    expect(result.accessState).toBe("NO_SUBSCRIPTION");
    expect(result.shouldRedirectToSubscribe).toBe(true);
    expect(result.commercialLifecycleState).toBe("pending-subscribe");
  });
});
