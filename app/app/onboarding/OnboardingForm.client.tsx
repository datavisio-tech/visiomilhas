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
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <div>Estado: {onboardingState}</div>
        <div>Fluxo: {flowStage}</div>
      </div>

      {success ? (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded">{success}</div>
      ) : null}

      {error ? (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">Erro: {error}. Tente novamente.</div>
      ) : null}

      <button
        onClick={handleStart}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {loading ? 'Validando...' : onboardingState === "partial" ? 'Recuperar onboarding' : 'Começar'}
      </button>

      <div className="mt-3 text-sm text-gray-600">
        Se algo falhar, tente novamente. O processo é idempotente e seguro para retry.
      </div>
    </div>
  );
}
