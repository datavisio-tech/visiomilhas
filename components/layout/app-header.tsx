"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authClient from "../../lib/auth-client";

type AppHeaderProps = {
  email?: string | null;
};

export default function AppHeader({ email }: AppHeaderProps) {
  const [loadingAction, setLoadingAction] = useState<
    "signin" | "signout" | null
  >(null);
  const router = useRouter();
  const isAuthenticated = Boolean(email);

  async function handleGoogleSignIn() {
    try {
      setLoadingAction("signin");
      const callbackURL = encodeURIComponent(window.location.pathname);
      window.location.assign(`/sign-in?callbackUrl=${callbackURL}`);
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(
        error instanceof Error
          ? error.message
          : "Falha ao iniciar login com Google",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSignOut() {
    try {
      setLoadingAction("signout");

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/");
            router.refresh();
          },
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(
        error instanceof Error ? error.message : "Falha ao encerrar a sessão",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <header className="w-full border-b border-slate-100 bg-white/96 px-8 py-4 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold tracking-tight text-slate-950">
            VisioMilhas
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">{email}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loadingAction === "signout"}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-50 hover:shadow-card disabled:opacity-60"
              >
                {loadingAction === "signout" ? "Saindo..." : "Sair"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingAction === "signin"}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-card disabled:opacity-60"
            >
              {loadingAction === "signin" ? "Entrando..." : "Entrar"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
