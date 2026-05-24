import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";
import { getOnboardingStateByEmail } from "../../../lib/server/onboarding";
import OnboardingFormClient from "./OnboardingForm.client";

export default async function OnboardingPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "onboarding.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/onboarding");
  }

  const email = sessionContext.auth.email ?? null;
  const onboardingState = await getOnboardingStateByEmail(email);

  if (onboardingState === "ready") {
    redirect("/app/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Seja bem-vindo</h1>
      <p className="mb-4">Obrigado por se cadastrar. Vamos configurar sua conta pessoal rapidamente.</p>
      <OnboardingFormClient
        onboardingState={onboardingState}
        flowStage={onboardingState === "partial" ? "recovery" : "start"}
      />
    </div>
  );
}
