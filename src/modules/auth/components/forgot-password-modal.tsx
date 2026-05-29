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

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onBackToLogin: () => void;
};

export default function ForgotPasswordModal({
  isOpen,
  onOpenChange,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Não foi possível enviar o e-mail.");
      return;
    }

    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/reset-password`;
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, redirectTo }),
      });

      if (!response.ok) {
        setError("Não foi possível enviar o e-mail.");
        return;
      }

      setSent(true);
      showToast({ title: "E-mail enviado.", variant: "success" });
    } catch {
      setError("Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[30rem]">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>E-mail enviado</DialogTitle>
              <DialogDescription>
                Se o endereço informado existir em nossa base, você receberá um
                link para criar uma nova senha.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <ShadcnButton
                type="button"
                variant="primary"
                className="w-full"
                onClick={onBackToLogin}
              >
                Voltar ao login
              </ShadcnButton>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Recuperar acesso</DialogTitle>
              <DialogDescription>
                Informe o e-mail utilizado no cadastro. Enviaremos um link para
                redefinição de senha.
              </DialogDescription>
            </DialogHeader>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
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

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <DialogFooter>
                <ShadcnButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Enviando link..." : "Enviar link"}
                </ShadcnButton>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
