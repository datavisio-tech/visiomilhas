import { NextResponse } from "next/server";
import { listPurchases as listSvc } from "../../../src/modules/purchases/application/services";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const organizationId = Number(
      url.searchParams.get("organizationId") ?? "0",
    );
    const q = url.searchParams.get("q") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const items = await listSvc({ organizationId, q, status }, 200, 0);
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}
