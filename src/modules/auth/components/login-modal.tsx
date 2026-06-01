"use client";

import {
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

type LoginModalProps = {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  callbackUrl: string;
  onRequestRegister: () => void;
  onRequestForgotPassword: () => void;
  onContinueWithGoogle: () => Promise<void>;
};

export default function LoginModal({
  isOpen,
  onOpenChange,
  callbackUrl,
  onRequestRegister,
  onRequestForgotPassword,
  onContinueWithGoogle,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
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
        setError("E-mail ou senha inválidos.");
        return;
      }

      showToast({ title: "Login realizado", variant: "success" });
      onOpenChange(false);
      window.location.assign(payload?.url || callbackUrl);
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[30rem]">
        <DialogHeader>
          <DialogTitle>Entrar na sua conta</DialogTitle>
          <DialogDescription>
            Acesse sua operação utilizando seu e-mail e senha.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              autoFocus
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
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-emerald-700 hover:text-emerald-800"
              onClick={onRequestForgotPassword}
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              className="font-medium text-slate-700 hover:text-slate-900"
              onClick={onRequestRegister}
            >
              Ainda não tenho conta
            </button>
          </div>

          <DialogFooter className="mt-2">
            <ShadcnButton
              type="button"
              variant="outline"
              className="w-full"
              onClick={onContinueWithGoogle}
              disabled={loading}
            >
              Entrar com Google
            </ShadcnButton>
            <ShadcnButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </ShadcnButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
