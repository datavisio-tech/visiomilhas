import { NextResponse } from "next/server";
import { createDrizzlePurchasesRepo } from "../../../../../src/modules/purchases/infrastructure/drizzle-repo";
import { resolveControlledSessionContext } from "../../../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../../../lib/server/subscription-access";

const repo = createDrizzlePurchasesRepo();

export async function POST(req: Request, { params }: any) {
  try {
    const sessionContext = await resolveControlledSessionContext({
      source: "api.purchases.evidences",
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
        source: "api.purchases.evidences",
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

    const id = Number(params.id);
    const body = await req.json();
    const fileName = body.fileName ?? null;
    const fileType = body.fileType ?? null;
    const fileUrl = body.fileUrl ?? null;

    const row = await repo.insertEvidence(id, {
      fileName,
      fileType,
      fileUrl,
      uploadedAt: new Date(),
    });

    return NextResponse.json({ ok: true, evidence: row });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}
