"use client";

import { useEffect, useState, useTransition } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Dialog, {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Input from "../ui/input";
import ProgramSelector from "./program-selector";
import Separator from "../ui/separator";
import Switch from "../ui/switch";
import type {
  AccountOverview,
  AccountProgramOption,
} from "../../lib/data/accounts";
import {
  createAccountAction,
  inactivateAccountAction,
  softDeleteAccountAction,
  updateAccountAction,
} from "../../app/app/accounts/actions";

type DialogMode = "create" | "edit" | "view" | "adjust" | "inactive" | "delete";

type Props = {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  mode: DialogMode;
  programs: AccountProgramOption[];
  account?: AccountOverview | null;
};

type AccountFormState = {
  programId: string;
  nickname: string;
  addInitialBalance: boolean;
  initialBalance: string;
  initialCpm: string;
  isActive: boolean;
};

const emptyState: AccountFormState = {
  programId: "",
  nickname: "",
  addInitialBalance: true,
  initialBalance: "",
  initialCpm: "",
  isActive: true,
};

export default function NewAccountDialog({
  isOpen,
  onOpenChange,
  mode,
  programs,
  account,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<AccountFormState>(() =>
    getInitialState(mode, account),
  );
  const [error, setError] = useState<string | null>(null);

  function submit(actionMode: DialogMode) {
    const formData = new FormData();
    formData.set(
      "mode",
      actionMode === "create"
        ? "create"
        : actionMode === "delete"
          ? "delete"
          : actionMode === "inactive"
            ? "inactive"
            : "edit",
    );

    if (account?.id) {
      formData.set("accountId", String(account.id));
    }
    if (formState.programId) {
      formData.set("programId", formState.programId);
    }
    formData.set("nickname", formState.nickname);
    formData.set("initialBalance", formState.initialBalance || "0");
    formData.set("initialCpm", formState.initialCpm || "0");
    if (formState.addInitialBalance) {
      formData.set("addInitialBalance", "on");
    }
    if (formState.isActive) {
      formData.set("isActive", "on");
    }

    setError(null);
    startTransition(async () => {
      try {
        let result: { success?: boolean; error?: string; errors?: any } = {
          success: false,
        };

        if (actionMode === "create") {
          result = await createAccountAction(formData);
        } else if (actionMode === "delete") {
          result = await softDeleteAccountAction(formData);
        } else if (actionMode === "inactive") {
          result = await inactivateAccountAction(formData);
        } else {
          result = await updateAccountAction(formData);
        }

        if (!result?.success) {
          setError(result?.error || JSON.stringify(result?.errors || {}));
          return;
        }

        onOpenChange(false);
        router.refresh();
      } catch (cause) {
        setError("Não foi possível salvar esta conta.");
      }
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    setFormState(getInitialState(mode, account));
    setError(null);
  }, [isOpen, mode, account]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle(mode)}</DialogTitle>
          <DialogDescription>{getDescription(mode)}</DialogDescription>
        </DialogHeader>

        {mode === "delete" || mode === "inactive" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">
                {account?.displayName ?? "Conta selecionada"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Essa conta ficará inativa e sairá das operações visíveis.
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-slate-950 text-white hover:bg-slate-900"
                onClick={() => submit(mode)}
                disabled={isPending}
              >
                {isPending
                  ? "Processando..."
                  : mode === "delete"
                    ? "Excluir conta"
                    : "Inativar conta"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {mode === "view" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Visualização
                </Badge>
                {!account?.isActive ? (
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                    Inativa
                  </Badge>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Programa de pontos
                </label>
                <ProgramSelector
                  selectedProgramId={formState.programId}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      programId: value,
                    }))
                  }
                  programs={programs}
                  disabled={mode === "view"}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Apelido da conta
                </label>
                <Input
                  value={formState.nickname}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      nickname: event.target.value,
                    }))
                  }
                  placeholder="Ex: Helena, Empresa, Família"
                  disabled={mode === "view"}
                />
                <p className="text-xs text-slate-500">
                  Ajuda a diferenciar múltiplas contas do mesmo programa.
                </p>
              </div>

              <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-950">
                    Adicionar saldo inicial
                  </div>
                  <div className="text-xs text-slate-500">
                    Ao ativar, o saldo e o CPM inicial entram como operação
                    seed.
                  </div>
                </div>
                <Switch
                  checked={formState.addInitialBalance}
                  onClick={() =>
                    setFormState((current) => ({
                      ...current,
                      addInitialBalance: !current.addInitialBalance,
                    }))
                  }
                  disabled={mode === "view"}
                />
              </div>

              {formState.addInitialBalance || mode !== "create" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Saldo inicial
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.initialBalance}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          initialBalance: event.target.value,
                        }))
                      }
                      placeholder="Ex: 10000"
                      disabled={mode === "view"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      CPM inicial
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.initialCpm}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          initialCpm: event.target.value,
                        }))
                      }
                      placeholder="Ex: 22.50"
                      disabled={mode === "view"}
                    />
                    <p className="text-xs text-slate-500">
                      Valor pago por mil pontos.
                    </p>
                  </div>
                </>
              ) : null}

              <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-950">
                    Conta ativa
                  </div>
                  <div className="text-xs text-slate-500">
                    Ative ou desative sem apagar o histórico.
                  </div>
                </div>
                <Switch
                  checked={formState.isActive}
                  onClick={() =>
                    setFormState((current) => ({
                      ...current,
                      isActive: !current.isActive,
                    }))
                  }
                  disabled={mode === "view"}
                />
              </div>
            </div>

            <Separator />

            {mode !== "view" ? (
              <DialogFooter>
                <Button
                  type="button"
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => submit(mode)}
                  disabled={isPending}
                >
                  {isPending
                    ? "Salvando..."
                    : mode === "create"
                      ? "Criar conta"
                      : "Salvar alterações"}
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter>
                <Button
                  type="button"
                  className="bg-slate-950 text-white hover:bg-slate-900"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            )}
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function getInitialState(
  mode: DialogMode,
  account?: AccountOverview | null,
): AccountFormState {
  if (!account) {
    return emptyState;
  }

  const balance = account.balance > 0 ? String(account.balance) : "";
  const cpm = account.cpmCents > 0 ? (account.cpmCents / 100).toFixed(2) : "";

  return {
    programId: String(account.programId ?? ""),
    nickname: account.nickname ?? "",
    addInitialBalance: mode === "create" ? true : account.balance > 0,
    initialBalance: balance,
    initialCpm: cpm,
    isActive: account.isActive,
  };
}

function getTitle(mode: DialogMode) {
  switch (mode) {
    case "create":
      return "Nova conta";
    case "edit":
      return "Editar conta";
    case "adjust":
      return "Ajustar saldo";
    case "inactive":
      return "Inativar conta";
    case "delete":
      return "Excluir conta";
    default:
      return "Detalhes da conta";
  }
}

function getDescription(mode: DialogMode) {
  switch (mode) {
    case "create":
      return "Crie uma nova conta operacional com saldo e CPM inicial opcionais.";
    case "edit":
      return "Atualize apelido, saldo, CPM e estado operacional da conta.";
    case "adjust":
      return "Ajuste o saldo operacional sem perder a leitura da conta.";
    case "inactive":
      return "Desative a conta e remova-a da operação visível.";
    case "delete":
      return "Essa conta ficará inativa e sairá das operações visíveis.";
    default:
      return "Leia os detalhes operacionais desta conta.";
  }
}
