"use client";

import { useState } from "react";

type GoogleSignInCardProps = {
  callbackUrl: string;
};

export default function GoogleSignInCard({ callbackUrl }: GoogleSignInCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          callbackURL: callbackUrl,
        }),
      });

      const responseText = await response.text();
      let data: { url?: string; message?: string; error?: string } | null = null;

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText) as { url?: string; message?: string; error?: string };
        } catch {
          data = { error: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message ?? data?.error ?? "Falha ao iniciar login com Google");
      }

      if (!data?.url) {
        throw new Error("Fluxo OAuth sem URL de redirecionamento");
      }

      window.location.assign(data.url);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Falha ao iniciar login com Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Fluxo OAuth oficial
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Entrar no VisioMilhas</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use sua conta Google para acessar o dashboard, retomar o onboarding ou validar a sessão persistida.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Abrindo login Google..." : "Continuar com Google"}
      </button>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Após o login, você volta para {callbackUrl} e o servidor decide se o próximo passo é dashboard ou onboarding.
      </p>
    </div>
  );
}