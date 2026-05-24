import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";
import { isUserOnboardedByEmail } from "../../../lib/server/onboarding";
import dynamic from "next/dynamic";

const OnboardingFormClient = dynamic(() => import("./OnboardingForm.client"), {
  ssr: false,
});

export default async function OnboardingPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "onboarding.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/api/auth?provider=google");
  }

  const email = sessionContext?.auth.email ?? null;

  // If already onboarded, redirect to dashboard
  if (email) {
    const onboarded = await isUserOnboardedByEmail(email);
    if (onboarded) redirect("/app/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Seja bem-vindo</h1>
      <p className="mb-4">Obrigado por se cadastrar. Vamos configurar sua conta pessoal rapidamente.</p>
      <OnboardingFormClient />
    </div>
  );
}
