import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { redirect } from "next/navigation";
import { isUserOnboardedByEmail, ensureInitialOrganizationAndAccount } from "../../../lib/server/onboarding";

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

  async function startOnboarding() {
    'use server';
    // perform idempotent creation
    const emailLocal = (sessionContext?.auth.email as string) ?? null;
    if (!emailLocal) {
      redirect("/api/auth?provider=google");
    }

    const { ensureGlobalUser } = await import("../../../lib/server/onboarding");
    const globalUserId = await ensureGlobalUser(emailLocal, null, null);

    if (globalUserId) {
      await ensureInitialOrganizationAndAccount(globalUserId, emailLocal);
    }

    redirect("/app/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Seja bem-vindo</h1>
      <p className="mb-4">Obrigado por se cadastrar. Vamos configurar sua conta pessoal rapidamente.</p>
      <form action={startOnboarding}>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Começar</button>
      </form>
    </div>
  );
}
