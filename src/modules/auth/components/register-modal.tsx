"use client";

import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import Dialog, {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import Input from "../../../../components/ui/input";
import ShadcnButton from "../../../../components/ui/shadcn-button";
import { showToast } from "../../../../components/ui/toast";

type RegisterModalProps = {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  callbackUrl: string;
  onRequestLogin: () => void;
  onContinueWithGoogle: () => Promise<void>;
};

export default function RegisterModal({
  isOpen,
  onOpenChange,
  callbackUrl,
  onRequestLogin,
  onContinueWithGoogle,
}: RegisterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome obrigatório");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email válido");
      return;
    }

    if (password.length < 8) {
      setError("Senha mínima de 8 caracteres");
      return;
    }

    if (!confirmPassword) {
      setError("Confirmação obrigatória");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas iguais");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "Você precisa aceitar os Termos de Uso e Política de Privacidade.",
      );
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email,
          password,
          callbackURL: callbackUrl,
          rememberMe: true,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        setError("Não foi possível criar sua conta.");
        return;
      }

      showToast({
        title: "Conta criada com sucesso.",
        variant: "success",
      });

      onOpenChange(false);
      if (payload?.url) {
        window.location.assign(payload.url);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[30rem]">
        <DialogHeader>
          <DialogTitle>Criar conta</DialogTitle>
          <DialogDescription>
            Comece a organizar suas milhas em poucos minutos.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nome completo
            </label>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Confirmar senha
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita sua senha"
              autoComplete="new-password"
              required
            />
            {passwordMismatch ? (
              <p className="text-xs text-rose-600">Senhas iguais</p>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              required
            />
            <span>Li e aceito os Termos de Uso e Política de Privacidade</span>
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <DialogFooter className="mt-2">
            <ShadcnButton
              type="button"
              variant="outline"
              className="w-full"
              onClick={onContinueWithGoogle}
              disabled={loading}
            >
              Cadastrar com Google
            </ShadcnButton>
            <ShadcnButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </ShadcnButton>
          </DialogFooter>

          <div className="text-center text-sm text-slate-600">
            Já possui conta?{" "}
            <button
              type="button"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
              onClick={onRequestLogin}
            >
              Entrar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
