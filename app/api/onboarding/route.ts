import { NextResponse } from "next/server";
import { resolveCurrentBetterAuthSessionContext } from "../../../lib/server/better-auth-session";
import { ensureGlobalUser, ensureInitialOrganizationAndAccount } from "../../../lib/server/onboarding";
import { reportOnboardingEvent } from "../../../lib/server/auth-observability";

export async function POST() {
  try {
    const session = await resolveCurrentBetterAuthSessionContext();

    if (!session) {
      reportOnboardingEvent("ONBOARDING_FAILED", { source: "api.onboarding", stage: "auth-missing" });
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const email = session.auth.email ?? null;
    if (!email) {
      reportOnboardingEvent("ONBOARDING_FAILED", { source: "api.onboarding", stage: "missing-email" });
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    reportOnboardingEvent("ONBOARDING_STARTED", { source: "api.onboarding", stage: "start" });

    try {
      const globalUserId = await ensureGlobalUser(email, null, null);

      if (globalUserId) {
        await ensureInitialOrganizationAndAccount(globalUserId, email);
      }

      reportOnboardingEvent("ONBOARDING_COMPLETED", { source: "api.onboarding", stage: "completed" });
      return NextResponse.json({ ok: true });
    } catch (err) {
      reportOnboardingEvent("ONBOARDING_FAILED", { source: "api.onboarding", stage: "provision", reason: String(err) });
      return NextResponse.json({ ok: false, error: "provision_failed" }, { status: 500 });
    }
  } catch (err) {
    reportOnboardingEvent("ONBOARDING_FAILED", { source: "api.onboarding", stage: "unexpected", reason: String(err) });
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }
}
