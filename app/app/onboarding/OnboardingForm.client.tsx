"use client";
import React, { useState } from "react";

type OnboardingFormClientProps = {
  onboardingState: "missing-session" | "not-started" | "partial" | "ready";
  flowStage: string;
};

export default function OnboardingFormClient({ onboardingState, flowStage }: OnboardingFormClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleStart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(data.status === "recovered" ? "Recuperamos seu onboarding com segurança." : "Onboarding concluído com sucesso.");
        window.location.href = '/subscribe';
        return;
      }
      setError(data.error ?? 'unknown_error');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Estado
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-800">
            {onboardingState}
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-800">
            {flowStage}
          </span>
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500">
          O botão abaixo cria ou recupera a base operacional sem expor detalhes técnicos ao usuário.
        </div>
      </div>

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-800">
          Erro: {error}. Tente novamente.
        </div>
      ) : null}

      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading
          ? "Validando..."
          : onboardingState === "partial"
            ? "Recuperar base operacional"
            : "Criar base operacional"}
      </button>

      <div className="mt-3 text-sm leading-6 text-slate-600">
        Se algo falhar, tente novamente. O processo é idempotente, seguro para retry e pensado para reduzir fricção no primeiro uso.
      </div>
    </div>
  );
}
