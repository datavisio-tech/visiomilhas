import { NextResponse } from "next/server";
import { registerPurchase } from "../../../../src/modules/purchases/application/services";
import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../../lib/server/subscription-access";
import { appPool } from "../../../../db/app/client";

export async function POST(req: Request) {
  try {
    const sessionContext = await resolveControlledSessionContext({
      source: "api.purchases.create",
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
        source: "api.purchases.create",
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
    const accountId = Number(body?.accountId);

    if (!Number.isFinite(accountId)) {
      return NextResponse.json(
        { ok: false, error: "accountId is required" },
        { status: 400 },
      );
    }

    const client = await appPool().connect();
    try {
      const accountRes = await client.query(
        "SELECT id, program_id FROM program_accounts WHERE id = $1 LIMIT 1",
        [accountId],
      );

      const account = accountRes.rows[0];
      if (!account) {
        return NextResponse.json(
          { ok: false, error: "account not found" },
          { status: 404 },
        );
      }

      if (body?.programId != null) {
        const bodyProgramId = Number(body.programId);
        if (
          Number.isFinite(bodyProgramId) &&
          bodyProgramId !== Number(account.program_id)
        ) {
          return NextResponse.json(
            { ok: false, error: "account does not belong to selected program" },
            { status: 422 },
          );
        }
      }

      body.programId = Number(account.program_id);
    } finally {
      client.release();
    }

    const res = await registerPurchase(body);
    return NextResponse.json({ ok: true, res });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}
