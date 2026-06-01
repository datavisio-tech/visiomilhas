import { NextResponse } from "next/server";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { getAccountsOverview } from "../../../lib/data/accounts";

export async function GET(req: Request) {
  try {
    const sessionContext = await resolveControlledSessionContext({
      source: "api.accounts.list",
      allowFallback: false,
    });

    if (!sessionContext) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const programIdParam = url.searchParams.get("programId");
    const programId = programIdParam ? Number(programIdParam) : null;

    const accounts = await getAccountsOverview(sessionContext);
    const filtered = Number.isFinite(programId as number)
      ? accounts.filter((account) => account.programId === Number(programId))
      : accounts;

    return NextResponse.json({ ok: true, items: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 },
    );
  }
}
