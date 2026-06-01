import { NextResponse } from "next/server";

import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../../lib/server/subscription-access";

export async function GET() {
  const sessionContext = await resolveControlledSessionContext({
    source: "subscription.access",
    allowFallback: false,
  });

  if (!sessionContext) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  const accessContext = await resolveSubscriptionAccessContext(sessionContext, {
    source: "subscription.access",
  });

  if (!accessContext) {
    return NextResponse.json(
      { ok: false, error: "missing-access-context" },
      { status: 400 },
    );
  }

  const canWrite =
    accessContext.accessState === "ACTIVE" ||
    accessContext.accessState === "TRIAL";

  return NextResponse.json({
    ok: true,
    accessState: accessContext.accessState,
    subscriptionStatus: accessContext.subscriptionStatus,
    canWrite,
  });
}
