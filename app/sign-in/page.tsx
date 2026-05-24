import GoogleSignInCard from "../../components/auth/google-sign-in-card.client";

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = searchParams?.callbackUrl?.trim() || "/app/dashboard";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
            Browser validation · OAuth real
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Login, callback e onboarding validado no navegador.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Este fluxo envia você para o Google, retorna ao callback correto e mantém o runtime recovery-only sem esconder o estado visual.
          </p>

          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-900">Sessão persistida</div>
              <div className="mt-1 text-sm text-slate-600">Valida reopen, refresh e logout.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-900">Onboarding recovery</div>
              <div className="mt-1 text-sm text-slate-600">Recupera usuário parcial sem duplicar recursos.</div>
            </div>
          </div>
        </section>

        <section>
          <GoogleSignInCard callbackUrl={callbackUrl} />
        </section>
      </div>
    </main>
  );
}