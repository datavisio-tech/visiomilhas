import { NextResponse } from "next/server";
import { appPool } from "../../../../db/app/client";
import { inspectFifoConsumption } from "../../../../lib/server/financial-integrity";
import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("accountId");

  const sessionContext = await resolveControlledSessionContext({
    source: "inspection.fifo.api",
    allowFallback: false,
  });

  if (!sessionContext) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const pool = appPool();
  const client = await pool.connect();
  try {
    const organizationId = sessionContext.ownership.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "organization missing" }, { status: 400 });
    }

    const inspection = await inspectFifoConsumption(client as any, {
      organizationId,
      accountId: accountId ? Number(accountId) : undefined,
    });

    return NextResponse.json({ success: true, inspection });
  } finally {
    client.release();
  }
}
