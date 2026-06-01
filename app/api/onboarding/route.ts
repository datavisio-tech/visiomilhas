import { NextResponse } from "next/server";
import { resolveCurrentBetterAuthSessionContext } from "../../../lib/server/better-auth-session";
import {
  ensureGlobalUser,
  ensureInitialOrganizationAndAccount,
  getOnboardingStateByEmail,
} from "../../../lib/server/onboarding";
import {
  reportAuthEvent,
  reportOnboardingEvent,
  resolveRuntimeEnvironmentTag,
  resolveBrowserContextTag,
} from "../../../lib/server/auth-observability";

export async function POST(request: Request) {
  const browserContext = resolveBrowserContextTag(request.headers.get("user-agent"));

  try {
    const session = await resolveCurrentBetterAuthSessionContext();

    if (!session) {
      reportAuthEvent({
        level: "warn",
        code: "OAUTH_REDIRECT_LOOP",
        message: "Onboarding request reached without an authenticated session",
        details: {
          source: "api.onboarding",
          stage: "auth-missing",
          runtimeState: "auth-missing",
          retryState: "blocked",
          recoveryState: "none",
          flowStage: "staging-validation",
          environmentTag: resolveRuntimeEnvironmentTag(),
          browserContext,
        },
      });
      reportOnboardingEvent("ONBOARDING_FAILED", {
        source: "api.onboarding",
        stage: "auth-missing",
        severity: "warn",
        runtimeState: "auth-missing",
        retryState: "blocked",
        recoveryState: "none",
        environmentTag: resolveRuntimeEnvironmentTag(),
        browserContext,
      });
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const email = session.auth.email ?? null;
    if (!email) {
      reportOnboardingEvent("ONBOARDING_FAILED", {
        source: "api.onboarding",
        stage: "missing-email",
        severity: "warn",
        runtimeState: "session-incomplete",
        retryState: "retryable",
        recoveryState: "none",
        environmentTag: resolveRuntimeEnvironmentTag(),
        browserContext,
      });
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 },
      );
    }

    const currentState = await getOnboardingStateByEmail(email);

    reportAuthEvent({
      level: "info",
      code: "OAUTH_RUNTIME_STAGING_CHECK",
      message: "Staging onboarding runtime check",
      details: {
        source: "api.onboarding",
        stage: "session-validated",
        state: currentState,
        environmentTag: resolveRuntimeEnvironmentTag(),
        runtimeState: currentState,
        retryState: currentState === "partial" ? "retryable" : "fresh",
        recoveryState:
          currentState === "partial" ? "partial-provision" : "none",
        flowStage: "staging-validation",
          browserContext,
      },
    });

    reportOnboardingEvent("ONBOARDING_STARTED", {
      source: "api.onboarding",
      stage: "start",
      state: currentState,
      flowStage: "staging-validation",
      severity: "info",
      runtimeState: "staging-audit",
      retryState: currentState === "partial" ? "retryable" : "fresh",
      recoveryState: currentState === "partial" ? "partial-provision" : "none",
      environmentTag: resolveRuntimeEnvironmentTag(),
      browserContext,
    });

    if (currentState === "ready") {
      reportOnboardingEvent("ONBOARDING_DUPLICATE_PREVENTED", {
        source: "api.onboarding",
        stage: "dedupe",
        state: currentState,
        flowStage: "staging-validation",
        severity: "warn",
        runtimeState: "staging-audit",
        retryState: "duplicate-prevented",
        recoveryState: "already-ready",
        environmentTag: resolveRuntimeEnvironmentTag(),
        browserContext,
      });

      return NextResponse.json({
        ok: true,
        status: "already_onboarded",
        onboardingState: currentState,
        flowStage: "dedupe",
      });
    }

    try {
      const globalUserId = await ensureGlobalUser(email, null, null);

      if (globalUserId) {
        const result = await ensureInitialOrganizationAndAccount(
          globalUserId,
          email,
        );

        if (result?.status === "recovered") {
          reportOnboardingEvent("ONBOARDING_RECOVERY", {
            source: "api.onboarding",
            stage: "recovery",
            state: currentState,
            flowStage: "staging-validation",
            severity: "info",
            runtimeState: "staging-audit",
            retryState: "retry-safe",
            recoveryState: "recovered",
            environmentTag: resolveRuntimeEnvironmentTag(),
          });
        }
      }

      reportOnboardingEvent("ONBOARDING_COMPLETED", {
        source: "api.onboarding",
        stage: "completed",
        state: currentState,
        flowStage: "staging-validation",
        severity: "info",
        runtimeState: currentState === "partial" ? "recovered" : "stable",
        retryState: "completed",
        recoveryState: currentState === "partial" ? "recovered" : "none",
        environmentTag: resolveRuntimeEnvironmentTag(),
        browserContext,
      });
      return NextResponse.json({
        ok: true,
        status: currentState === "partial" ? "recovered" : "completed",
        onboardingState: currentState,
        flowStage: currentState === "partial" ? "recovery" : "completed",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      reportAuthEvent({
        level: "error",
        code: "OAUTH_CALLBACK_FAILED",
        message: "Onboarding provisioning failed during OAuth flow",
        details: {
          source: "api.onboarding",
          stage: "provision",
          state: currentState,
          flowStage: "staging-validation",
          environmentTag: resolveRuntimeEnvironmentTag(),
          runtimeState: "failure",
          retryState: "retryable",
          recoveryState:
            currentState === "partial" ? "partial-provision" : "none",
          error: errorMessage,
          browserContext,
        },
      });
      reportOnboardingEvent("ONBOARDING_FAILED", {
        source: "api.onboarding",
        stage: "provision",
        reason: errorMessage,
        state: currentState,
        flowStage: "staging-validation",
        severity: "error",
        runtimeState: "failure",
        retryState: "retryable",
        recoveryState:
          currentState === "partial" ? "partial-provision" : "none",
        environmentTag: resolveRuntimeEnvironmentTag(),
        browserContext,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "provision_failed",
          onboardingState: currentState,
          flowStage: "failed",
        },
        { status: 500 },
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    reportAuthEvent({
      level: "error",
      code: "OAUTH_CALLBACK_FAILED",
      message: "Unexpected onboarding runtime failure",
      details: {
        source: "api.onboarding",
        stage: "unexpected",
        environmentTag: resolveRuntimeEnvironmentTag(),
        runtimeState: "failure",
        retryState: "retryable",
        recoveryState: "unknown",
        error: errorMessage,
        browserContext,
      },
    });
    reportOnboardingEvent("ONBOARDING_FAILED", {
      source: "api.onboarding",
      stage: "unexpected",
      reason: errorMessage,
      flowStage: "runtime",
      severity: "error",
      runtimeState: "failure",
      retryState: "retryable",
      recoveryState: "unknown",
      environmentTag: resolveRuntimeEnvironmentTag(),
      browserContext,
    });
    return NextResponse.json(
      { ok: false, error: "unexpected", flowStage: "runtime" },
      { status: 500 },
    );
  }
}
