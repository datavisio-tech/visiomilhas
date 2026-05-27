"use client";

import { useState } from "react";
import ShadcnButton from "../ui/shadcn-button";

type GoogleSignInCardProps = {
  callbackUrl: string;
};

export default function GoogleSignInCard({
  callbackUrl,
}: GoogleSignInCardProps) {
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
      let data: { url?: string; message?: string; error?: string } | null =
        null;

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText) as {
            url?: string;
            message?: string;
            error?: string;
          };
        } catch {
          data = { error: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ?? data?.error ?? "Falha ao iniciar login com Google",
        );
      }

      if (!data?.url) {
        throw new Error("Fluxo OAuth sem URL de redirecionamento");
      }

      window.location.assign(data.url);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Falha ao iniciar login com Google",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-white shadow-[0_32px_120px_rgba(2,6,23,0.58)] backdrop-blur-2xl sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_26%)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.65)]" />
          Acesso seguro
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
          Continue com Google
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Login rápido e seguro para entrar no VisioMilhas com experiência
          premium.
        </p>
        <div className="mt-6">
          <ShadcnButton
            type="button"
            variant="primary"
            className="group flex w-full items-center justify-center gap-3 px-5 py-4 text-base shadow-[0_16px_48px_rgba(124,58,237,0.32)]"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Continuando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg
                    viewBox="0 0 48 48"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.7 1.2 9.2 3.5l6.9-6.9C36 2.7 30.5 0 24 0 14.6 0 6.5 5.3 2.5 13l8 6.2C12.6 13 17.9 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3.1-2.4 5.7-5 7.5l7.8 6.1c4.5-4.1 7-10.2 7-17.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M11.2 28.2A14.5 14.5 0 0 1 10.4 24c0-1.4.2-2.8.6-4.2l-8-6.2A24 24 0 0 0 0 24c0 3.8.9 7.5 2.5 10.7l8.7-6.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6.1c-2.2 1.5-5 2.4-8.2 2.4-6.1 0-11.4-3.5-14-8.7l-8.7 6.5C5.2 42.5 13.7 48 24 48z"
                    />
                  </svg>
                </span>
                Continuar com Google
              </span>
            )}
          </ShadcnButton>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-sm">
            {error}
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-6 text-white/55">
          Sem senha. Autenticação Google instantânea para acessar seu painel.
        </p>
      </div>
    </div>
  );
}
