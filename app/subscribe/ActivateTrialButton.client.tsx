"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActivateTrialButtonProps = {
  disabled?: boolean;
};

function getActivationErrorMessage(error: string) {
  switch (error) {
    case "unauthenticated":
      return "Sua sessão expirou. Entre novamente para ativar o trial.";
    case "missing-access-context":
      return "Não conseguimos carregar seu acesso agora. Recarregue a página e tente outra vez.";
    case "subscription-blocked":
      return "Seu acesso está bloqueado e não pode ativar o trial neste momento.";
    default:
      return "Não foi possível ativar seu trial agora. Tente novamente.";
  }
}

export default function ActivateTrialButton({
  disabled,
}: ActivateTrialButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const router = useRouter();

  async function handleActivate() {
    if (disabled || status === "loading") return;

    setStatus("loading");
    setFeedback(null);
    setFeedbackTone(null);

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
        setFeedback(getActivationErrorMessage(payload?.error ?? ""));
        setFeedbackTone("error");
        return;
      }

      setStatus("success");
      setFeedback(
        payload?.status === "already-active"
          ? "Seu trial já estava ativo. Redirecionando para o onboarding..."
          : "Trial ativado com sucesso. Redirecionando para o onboarding...",
      );
      setFeedbackTone("success");
      router.replace("/app/onboarding");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setFeedback(
        err instanceof Error
          ? "Não foi possível ativar seu trial agora. Tente novamente."
          : "Não foi possível ativar seu trial agora. Tente novamente.",
      );
      setFeedbackTone("error");
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
          ? "Ativando teste grátis..."
          : "Começar teste grátis"}
      </button>
      {feedback ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            feedbackTone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
