import { NextResponse } from "next/server";
import { changePurchaseStatus } from "../../../../src/modules/purchases/application/services";
import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../../lib/server/subscription-access";

export async function POST(req: Request) {
  try {
    const sessionContext = await resolveControlledSessionContext({
      source: "api.purchases.change-status",
      allowFallback: false,
    });

    if (!sessionContext) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const accessContext = await resolveSubscriptionAccessContext(
      sessionContext,
      {
        source: "api.purchases.change-status",
      },
    );

    if (!accessContext) {
      return NextResponse.json(
        { ok: false, error: "access_context_missing" },
        { status: 403 },
      );
    }

    const canWrite =
      accessContext.accessState === "ACTIVE" ||
      accessContext.accessState === "TRIAL";
    if (!canWrite) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { id, status, notes } = body;
    if (!id || !status)
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 },
      );
    const res = await changePurchaseStatus(Number(id), String(status), notes);
    return NextResponse.json({ ok: true, res });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}
