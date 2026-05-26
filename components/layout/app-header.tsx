"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authClient from "../../lib/auth-client";

type AppHeaderProps = {
  email?: string | null;
};

export default function AppHeader({ email }: AppHeaderProps) {
  const [loadingAction, setLoadingAction] = useState<"signin" | "signout" | null>(null);
  const router = useRouter();
  const isAuthenticated = Boolean(email);

  async function handleGoogleSignIn() {
    try {
      setLoadingAction("signin");
      const callbackURL = encodeURIComponent(window.location.pathname);
      window.location.assign(`/sign-in?callbackUrl=${callbackURL}`);
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(error instanceof Error ? error.message : "Falha ao iniciar login com Google");
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
      window.alert(error instanceof Error ? error.message : "Falha ao encerrar a sessão");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <header className="w-full bg-white border-b p-4 flex items-center justify-between">
      <div className="text-lg font-semibold">VisioMilhas</div>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        {isAuthenticated ? (
          <>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
              Autenticado
            </span>
            <span>{email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loadingAction === "signout"}
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 disabled:opacity-60"
            >
              {loadingAction === "signout" ? "Saindo..." : "Sair"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingAction === "signin"}
            className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
          >
            {loadingAction === "signin" ? "Entrando..." : "Entrar com Google"}
          </button>
        )}
      </div>
    </header>
  );
}
