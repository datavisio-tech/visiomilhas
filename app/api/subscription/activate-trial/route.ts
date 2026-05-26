import { NextResponse } from "next/server";

import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import {
  activateTrialForOrganization,
  resolveSubscriptionAccessContext,
} from "../../../../lib/server/subscription-access";

export async function POST() {
  const sessionContext = await resolveControlledSessionContext({
    source: "subscription.activate-trial",
    allowFallback: false,
  });

  if (!sessionContext) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  const accessContext = await resolveSubscriptionAccessContext(sessionContext, {
    source: "subscription.activate-trial",
  });

  if (!accessContext) {
    return NextResponse.json(
      { ok: false, error: "missing-access-context" },
      { status: 400 },
    );
  }

  if (
    accessContext.subscriptionStatus === "active" ||
    accessContext.subscriptionStatus === "trialing"
  ) {
    return NextResponse.json({
      ok: true,
      status: "already-active",
      accessState: accessContext.accessState,
      commercialLifecycleState: accessContext.commercialLifecycleState,
    });
  }

  if (
    accessContext.subscriptionStatus === "canceled" ||
    accessContext.subscriptionStatus === "suspended"
  ) {
    return NextResponse.json(
      { ok: false, error: "subscription-blocked" },
      { status: 403 },
    );
  }

  const activated = await activateTrialForOrganization({
    organizationId: accessContext.organizationId,
    globalUserId: accessContext.globalUserId,
    planCode: accessContext.planCode,
    source: "subscription.activate-trial",
  });

  return NextResponse.json({
    ok: true,
    status: "trial-activated",
    accessState: activated.accessState,
    commercialLifecycleState: activated.commercialLifecycleState,
  });
}
