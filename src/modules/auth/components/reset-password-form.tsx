"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "../../../../components/ui/input";
import ShadcnButton from "../../../../components/ui/shadcn-button";
import { showToast } from "../../../../components/ui/toast";

type ResetPasswordFormProps = {
  token?: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Token inválido ou expirado.");
      return;
    }

    if (newPassword.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (!confirmPassword || newPassword !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        setError("Não foi possível redefinir sua senha.");
        return;
      }

      setSuccess(true);
      showToast({ title: "Senha redefinida.", variant: "success" });
      setTimeout(() => router.push("/sign-in"), 1000);
    } catch {
      setError("Não foi possível redefinir sua senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[30rem] rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-white shadow-[0_32px_120px_rgba(2,6,23,0.58)] backdrop-blur-2xl sm:p-7">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
        Redefinir senha
      </h1>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Defina uma nova senha para voltar ao seu painel.
      </p>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          Senha atualizada com sucesso. Faça login novamente.
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Nova senha
            </label>
            <Input
              autoFocus
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Confirmar nova senha
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <ShadcnButton
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </ShadcnButton>
        </form>
      )}
    </div>
  );
}
