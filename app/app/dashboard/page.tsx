export const dynamic = "force-dynamic";

import MetricCard from "../../../components/dashboard/metric-card";
import DashboardChart from "../../../components/dashboard/dashboard-chart";
import TrialBanner from "../../../components/layout/trial-banner";
import {
  getMetrics,
  getRecentEntries,
  getRecentPurchases,
} from "../../../lib/server/dashboard";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../lib/server/subscription-access";
import {
  evaluateRolloutSanity,
  resolveRolloutAccess,
} from "../../../lib/server/rollout-control";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  reportAuthEvent,
  resolveBrowserContextTag,
} from "../../../lib/server/auth-observability";
import {
  buildOwnershipContext,
  buildSessionContext,
} from "../../../lib/server/auth-context";

export default async function DashboardPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "dashboard.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/dashboard");
  }

  const rolloutAccess = await resolveRolloutAccess(sessionContext, {
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  if (!rolloutAccess.allowed) {
    redirect("/subscribe");
  }

  const accessContext = await resolveSubscriptionAccessContext(sessionContext, {
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  if (!accessContext) {
    redirect("/subscribe");
  }

  if (accessContext.shouldRedirectToSubscribe) {
    redirect("/subscribe");
  }

  await evaluateRolloutSanity({
    sessionContext,
    accessContext,
    source: "dashboard.page",
    requestHeaders: await headers(),
  });

  const effectiveSessionContext =
    sessionContext.ownership.organizationId === accessContext.organizationId
      ? sessionContext
      : buildSessionContext(
          sessionContext.auth,
          buildOwnershipContext({
            userId: sessionContext.auth.userId,
            accountId: sessionContext.ownership.accountId ?? null,
            organizationId: accessContext.organizationId,
            ownsAccount: sessionContext.ownership.ownsAccount,
            ownsOrganizationScope: true,
          }),
        );

  if (!effectiveSessionContext.ownership.organizationId) {
    const requestHeaders = await headers();
    const browserContext = resolveBrowserContextTag(
      requestHeaders.get("user-agent"),
    );

    reportAuthEvent({
      level: "warn",
      code: "ONBOARDING_CONTEXT_MISSING",
      message: "Dashboard requires onboarding before rendering data",
      details: {
        source: "dashboard.page",
        onboardingStage: "required",
        recoveryStage: "direct",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: sessionContext.auth.sessionId ? "persisted" : "missing",
      },
    });

    reportAuthEvent({
      level: "info",
      code: "ONBOARDING_REQUIRED_REDIRECT",
      message: "Redirecting dashboard to onboarding",
      details: {
        source: "dashboard.page",
        onboardingStage: "redirect",
        recoveryStage: "direct",
        ownershipState: "missing",
        browserContext,
        sessionLifecycle: sessionContext.auth.sessionId ? "persisted" : "missing",
        redirectPath: "/app/onboarding",
      },
    });

    redirect("/app/onboarding");
  }
  const metrics = await getMetrics(effectiveSessionContext);
  const recentEntries = await getRecentEntries(effectiveSessionContext);
  const purchases = await getRecentPurchases(effectiveSessionContext);

  return (
    <div>
      {accessContext.accessState === "TRIAL" ? (
        <TrialBanner
          tone="warning"
          title="Seu trial SaaS está ativo"
          description="Você pode continuar usando o dashboard enquanto o período de avaliação estiver válido."
        />
      ) : null}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Saldo total"
          value={`${metrics.totalBalance.toLocaleString()} pts`}
        />
        <MetricCard
          title="Custo médio do milheiro"
          value={`R$ ${(metrics.avgCpmCents / 100).toFixed(2)}`}
        />
        <MetricCard
          title="Pontos a receber"
          value={`${metrics.pointsToReceive.toLocaleString()} pts`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <DashboardChart />
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Lançamentos recentes</h3>
            <ul className="text-sm text-gray-700">
              {recentEntries.map((e: any) => (
                <li key={e.id} className="py-1">
                  {e.date} — {e.description} — {e.points} pts — {e.status}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Compras recentes</h3>
            <ul className="text-sm text-gray-700">
              {purchases.map((p: any) => (
                <li key={p.id} className="py-1">
                  {p.status} — {p.points} pts — R${" "}
                  {(p.valueCents / 100).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
