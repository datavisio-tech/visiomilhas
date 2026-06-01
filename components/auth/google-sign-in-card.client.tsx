"use client";

import { useState } from "react";
import Link from "next/link";
import VisioMilhasBrand from "../branding/visiomilhas-brand";
import { Card, CardContent, CardHeader } from "../ui/card";
import Separator from "../ui/separator";
import ShadcnButton from "../ui/shadcn-button";
import LoginModal from "../../src/modules/auth/components/login-modal";
import RegisterModal from "../../src/modules/auth/components/register-modal";
import ForgotPasswordModal from "../../src/modules/auth/components/forgot-password-modal";

type GoogleSignInCardProps = {
  callbackUrl: string;
};

export default function GoogleSignInCard({
  callbackUrl,
}: GoogleSignInCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

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
    <>
      <Card className="mx-auto w-full max-w-[36rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm sm:max-w-[36rem]">
        <CardHeader className="space-y-6 px-8 py-10 sm:px-10">
          <VisioMilhasBrand subtitle="Acesse sua central operacional." />
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Acesse sua central operacional
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Entre com Google ou utilize seu acesso por e-mail.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10 sm:px-10">
          <div className="space-y-3">
            <ShadcnButton
              type="button"
              variant="primary"
              className="group flex w-full items-center justify-center gap-3 px-5 py-4 text-base shadow-[0_16px_32px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(124,58,237,0.22)]"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Entrando...
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
                  Entrar com Google
                </span>
              )}
            </ShadcnButton>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                ou
              </span>
              <Separator className="flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 hover:shadow-sm"
              onClick={() => setLoginModalOpen(true)}
            >
              Entrar com e-mail
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <button
              type="button"
              className="font-semibold text-violet-700 transition duration-200 hover:text-violet-800"
              onClick={() => setRegisterModalOpen(true)}
            >
              Não possui conta? Criar conta
            </button>

            <button
              type="button"
              className="font-semibold text-slate-500 transition duration-200 hover:text-slate-700"
              onClick={() => setForgotModalOpen(true)}
            >
              Recuperar acesso
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <Link href="#termos" className="transition hover:text-slate-700">
              Termos
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="#privacidade"
              className="transition hover:text-slate-700"
            >
              Privacidade
            </Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LoginModal
        isOpen={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        callbackUrl={callbackUrl}
        onRequestRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onRequestForgotPassword={() => {
          setLoginModalOpen(false);
          setForgotModalOpen(true);
        }}
        onContinueWithGoogle={handleGoogleSignIn}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        callbackUrl={callbackUrl}
        onRequestLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
        onContinueWithGoogle={handleGoogleSignIn}
      />

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onOpenChange={setForgotModalOpen}
        onBackToLogin={() => {
          setForgotModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </>
  );
}
