"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActivateTrialButtonProps = {
  disabled?: boolean;
};

export default function ActivateTrialButton({
  disabled,
}: ActivateTrialButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleActivate() {
    if (disabled || status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/subscription/activate-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setStatus("error");
        setError(payload?.error ?? "trial_activation_failed");
        return;
      }

      setStatus("success");
      router.replace("/app/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "trial_activation_failed");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleActivate}
        disabled={disabled || status === "loading"}
        className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? "Processando assinatura..."
          : "Assinar por R$ 4,99/mês"}
      </button>
      {status === "success" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Assinatura liberada com sucesso. Redirecionando...
        </div>
      ) : null}
      {status === "error" && error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Falha ao processar a assinatura: {error}. Tente novamente.
        </div>
      ) : null}
    </div>
  );
}
