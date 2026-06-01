import { NextResponse } from "next/server";

type MutatePayload = {
  mode: "create" | "edit" | "adjust" | "inactive" | "activate" | "delete";
  accountId?: number | string;
  programId?: number | string;
  nickname?: string;
  initialBalance?: number | string;
  initialCpm?: number | string;
  addInitialBalance?: boolean;
  isActive?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MutatePayload;

    const mode = body.mode;
    if (!mode) {
      return NextResponse.json(
        { success: false, error: "mode is required" },
        { status: 400 },
      );
    }

    const formData = new FormData();
    formData.set("mode", mode === "adjust" ? "edit" : mode);

    if (body.accountId !== undefined) {
      formData.set("accountId", String(body.accountId));
    }
    if (body.programId !== undefined) {
      formData.set("programId", String(body.programId));
    }

    formData.set("nickname", body.nickname ?? "");
    formData.set(
      "initialBalance",
      String(normalizeIntegerInput(body.initialBalance)),
    );
    formData.set("initialCpm", String(normalizeDecimalInput(body.initialCpm)));

    if (body.addInitialBalance) {
      formData.set("addInitialBalance", "on");
    }
    if (body.isActive) {
      formData.set("isActive", "on");
    }

    // require authenticated session and subscription access
    const { resolveControlledSessionContext } =
      await import("../../../../lib/server/controlled-session");
    const { resolveSubscriptionAccessContext } =
      await import("../../../../lib/server/subscription-access");

    const sessionContext = await resolveControlledSessionContext({
      source: "api.accounts.mutate",
      allowFallback: false,
    });

    if (!sessionContext) {
      return NextResponse.json(
        { success: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const accessContext = await resolveSubscriptionAccessContext(
      sessionContext,
      { source: "api.accounts.mutate" },
    );
    if (!accessContext) {
      return NextResponse.json(
        { success: false, error: "access_context_missing" },
        { status: 403 },
      );
    }

    const canWrite =
      accessContext.accessState === "ACTIVE" ||
      accessContext.accessState === "TRIAL";
    if (!canWrite) {
      return NextResponse.json(
        { success: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const actions = await import("../../../../app/app/accounts/actions");

    let result: any;
    if (mode === "create") {
      result = await actions.createAccountAction(formData);
    } else if (mode === "delete") {
      result = await actions.softDeleteAccountAction(formData);
    } else if (mode === "inactive") {
      result = await actions.inactivateAccountAction(formData);
    } else if (mode === "activate") {
      result = await actions.activateAccountAction(formData);
    } else {
      result = await actions.updateAccountAction(formData);
    }

    const status = result?.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "unexpected error" },
      { status: 500 },
    );
  }
}

function normalizeIntegerInput(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function normalizeDecimalInput(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
