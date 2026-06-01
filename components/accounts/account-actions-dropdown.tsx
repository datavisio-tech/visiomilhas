"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  PencilLine,
  Power,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Dialog, {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type AccountActionHandlers = {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AccountActionsDropdown({
  handlers,
  accountId,
  isActive,
}: {
  handlers: AccountActionHandlers;
  accountId?: number | string;
  isActive?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function toggleActive() {
    if (!accountId) return;

    try {
      const payload = isActive
        ? { mode: "inactive", accountId: String(accountId) }
        : { mode: "activate", accountId: String(accountId) };

      const res = await fetch("/api/accounts/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error("Falha ao alterar status da conta", json);
        const message = json?.error || "Falha ao alterar status da conta";
        (await import("../ui/toast")).showToast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
        return;
      }

      (await import("../ui/toast")).showToast({
        title: isActive ? "Conta inativada" : "Conta ativada",
        description: json?.displayName || undefined,
        variant: "success",
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      (await import("../ui/toast")).showToast({
        title: "Erro",
        description: "Não foi possível alterar o status da conta.",
        variant: "destructive",
      });
    }
  }

  async function confirmToggleActive() {
    setIsConfirming(true);
    try {
      setConfirmOpen(false);
      await toggleActive();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Ações da conta"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
        >
          <span suppressHydrationWarning aria-hidden="true">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlers.onView}>
            <span suppressHydrationWarning aria-hidden="true">
              <Eye className="mr-2 h-4 w-4" />
            </span>
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onEdit}>
            <span suppressHydrationWarning aria-hidden="true">
              <PencilLine className="mr-2 h-4 w-4" />
            </span>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            {isActive ? (
              <span suppressHydrationWarning aria-hidden="true">
                <Power className="mr-2 h-4 w-4" />
              </span>
            ) : (
              <span suppressHydrationWarning aria-hidden="true">
                <Plus className="mr-2 h-4 w-4" />
              </span>
            )}
            {isActive ? "Inativar" : "Ativar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={handlers.onDelete}>
            <span suppressHydrationWarning aria-hidden="true">
              <Trash2 className="mr-2 h-4 w-4" />
            </span>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isActive ? "Inativar conta" : "Ativar conta"}
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? "Essa conta sairá da operação visível, mas seus dados serão preservados."
                : "Essa conta voltará para a operação visível sem alterar saldo, CPM ou apelido."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-950">
              {isActive
                ? "Confirmação de inativação"
                : "Confirmação de ativação"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {isActive
                ? "Clique em confirmar para inativar."
                : "Clique em confirmar para ativar."}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:shadow-card active:scale-95 disabled:opacity-60"
              onClick={() => setConfirmOpen(false)}
              disabled={isConfirming}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition hover:shadow-card active:scale-95 disabled:opacity-60"
              style={{
                backgroundColor: isActive ? "#dc2626" : "#16a34a",
              }}
              onClick={confirmToggleActive}
              disabled={isConfirming}
            >
              {isConfirming ? "Processando..." : "Confirmar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
