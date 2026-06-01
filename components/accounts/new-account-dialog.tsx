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

type DialogMode = "create" | "edit" | "view" | "inactive" | "delete";

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

  const initialComparableState = getInitialState(mode, account);
  const isEditLikeMode = mode === "edit";
  const isCreateMode = mode === "create";
  const hasChanges = isEditLikeMode
    ? hasFormChanges(formState, initialComparableState, {
        ignoreSeedToggle: true,
      })
    : true;

  function submit(actionMode: DialogMode) {
    if (actionMode === "edit" && !hasChanges) {
      setError("Nenhuma alteração detectada para salvar.");
      return;
    }

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
    if (isCreateMode && formState.addInitialBalance) {
      formData.set("addInitialBalance", "on");
    }
    if (formState.isActive) {
      formData.set("isActive", "on");
    }

    setError(null);
    startTransition(async () => {
      try {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/accounts/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let result: { success?: boolean; error?: string; errors?: any } = {};
        try {
          result = await response.json();
        } catch {
          result = { success: false, error: "Resposta inválida do servidor." };
        }

        if (!response.ok || !result?.success) {
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
  }, [isOpen, mode, account, programs]);

  const selectedProgram = programs.find(
    (p) => String(p.id) === String(formState.programId),
  );
  const viewProgramName = account?.program ?? selectedProgram?.name ?? "—";
  const viewNickname = formState.nickname || "Sem apelido";
  const viewBalance = account
    ? `${account.balance.toLocaleString("pt-BR")} pts`
    : `${Number(formState.initialBalance || 0).toLocaleString("pt-BR")} pts`;
  const viewCpm = account
    ? `R$ ${(account.cpmCents / 100).toFixed(2)}`
    : `R$ ${Number(formState.initialCpm || 0).toFixed(2)}`;
  const viewCreatedAt = formatDateTimePtBr(account?.createdAt);
  const viewUpdatedAt = formatDateTimePtBr(account?.updatedAt);
  const operationalRisk = getOperationalRisk({
    isActive: account?.isActive ?? formState.isActive,
    balance: account?.balance ?? Number(formState.initialBalance || 0),
    cpmCents:
      account?.cpmCents ?? Math.round(Number(formState.initialCpm || 0) * 100),
  });

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
                {mode === "delete"
                  ? "Essa conta será removida da lista e manterá o histórico operacional."
                  : account?.isActive
                    ? "Essa conta será retirada da operação visível, mantendo o histórico operacional."
                    : "Essa conta voltará a participar da operação visível, sem perder o histórico."}
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
                className={
                  mode === "delete"
                    ? "!border-rose-600 !bg-rose-600 !text-white hover:!bg-rose-700"
                    : account?.isActive
                      ? "!border-rose-600 !bg-rose-600 !text-white hover:!bg-rose-700"
                      : "!border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700"
                }
                onClick={() => submit(mode)}
                disabled={isPending}
              >
                {isPending
                  ? "Processando..."
                  : mode === "delete"
                    ? "Excluir conta"
                    : account?.isActive
                      ? "Inativar conta"
                      : "Ativar conta"}
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

            {mode === "view" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Resumo da conta
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    {account?.displayName ?? "Conta selecionada"}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Visualização somente leitura para conferência rápida.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Programa
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewProgramName}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Apelido
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewNickname}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Saldo atual
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewBalance}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      CPM médio
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewCpm}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Criada em
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewCreatedAt}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Atualizada em
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {viewUpdatedAt}
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 ${operationalRisk.className}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Tag de risco operacional
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {operationalRisk.label}
                  </div>
                  <p className="mt-1 text-xs">{operationalRisk.description}</p>
                </div>
              </div>
            ) : (
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
                  />
                  <p className="text-xs text-slate-500">
                    Ajuda a diferenciar múltiplas contas do mesmo programa.
                  </p>
                </div>

                {mode === "create" ? (
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
                    />
                  </div>
                ) : null}

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
                  />
                </div>
              </div>
            )}

            <Separator />

            {mode !== "view" ? (
              <DialogFooter>
                <Button
                  type="button"
                  className="!border-slate-200 !bg-white !text-slate-700 hover:!bg-slate-50"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="!border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700"
                  onClick={() => submit(mode)}
                  disabled={isPending || (mode === "edit" && !hasChanges)}
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
                  className="!border-slate-950 !bg-slate-950 !text-white hover:!bg-slate-900"
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
    case "inactive":
      return "Desative a conta e remova-a da operação visível.";
    case "delete":
      return "Essa conta será removida da lista, mantendo o histórico operacional.";
    default:
      return "Leia os detalhes operacionais desta conta.";
  }
}

function normalizeForCompare(state: AccountFormState) {
  return {
    programId: String(state.programId || ""),
    nickname: String(state.nickname || "").trim(),
    addInitialBalance: Boolean(state.addInitialBalance),
    initialBalance: Number(state.initialBalance || 0),
    initialCpm: Number(state.initialCpm || 0),
    isActive: Boolean(state.isActive),
  };
}

function hasFormChanges(
  current: AccountFormState,
  initial: AccountFormState,
  options?: { ignoreSeedToggle?: boolean },
) {
  const a = normalizeForCompare(current);
  const b = normalizeForCompare(initial);

  return (
    a.programId !== b.programId ||
    a.nickname !== b.nickname ||
    (!options?.ignoreSeedToggle &&
      a.addInitialBalance !== b.addInitialBalance) ||
    a.initialBalance !== b.initialBalance ||
    a.initialCpm !== b.initialCpm ||
    a.isActive !== b.isActive
  );
}

function formatDateTimePtBr(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR");
}

function getOperationalRisk(params: {
  isActive: boolean;
  balance: number;
  cpmCents: number;
}) {
  if (!params.isActive) {
    return {
      label: "Alto",
      description: "Conta inativa. Não participa da operação visível.",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (params.balance <= 0) {
    return {
      label: "Médio",
      description:
        "Saldo zerado. Sem disponibilidade para operações imediatas.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (params.cpmCents >= 3000) {
    return {
      label: "Médio",
      description:
        "CPM elevado. Recomenda-se revisar custo e margem antes de vender.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Baixo",
    description: "Conta operacional saudável para uso no fluxo diário.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}
