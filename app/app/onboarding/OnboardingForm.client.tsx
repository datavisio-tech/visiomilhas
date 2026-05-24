"use client";
import React, { useState } from "react";

export default function OnboardingFormClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.location.href = '/app/dashboard';
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
      {error ? (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">Erro: {error}. Tente novamente.</div>
      ) : null}

      <button
        onClick={handleStart}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {loading ? 'Iniciando...' : 'Começar'}
      </button>

      <div className="mt-3 text-sm text-gray-600">Se algo falhar, tente novamente — o processo é idempotente.</div>
    </div>
  );
}
