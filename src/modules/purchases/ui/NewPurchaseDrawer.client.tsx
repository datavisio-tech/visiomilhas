"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import Select from "../../../../components/ui/select";
import Switch from "../../../../components/ui/switch";

type PartnerStoreOption = {
  id: number;
  name: string;
  logoUrl?: string | null;
};

type AccountOption = {
  id: number;
  displayName: string;
  balance: number;
  isActive: boolean;
  programId?: number | null;
  programName?: string | null;
};

export default function NewPurchaseDrawer({
  onCreated,
  organizationId,
}: {
  onCreated?: () => void;
  organizationId: number;
}) {
  const [isOpen, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    order_number: "",
    partner_store_id: "",
    account_id: "",
    program_id: "",
    program_name: "",
    purchase_amount: "",
    multiplier: "",
    payment_method: "card",
    card_participant_program: false,
    purchase_date: "",
    expected_credit_date: "",
    notes: "",
  });
  const [partnerStores, setPartnerStores] = useState<PartnerStoreOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partnerStoreOpen, setPartnerStoreOpen] = useState(false);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400";

  function change(e: any) {
    const { name, value } = e.target;
    // special handling when selecting account -> populate program fields
    if (name === "account_id") {
      const selectedId = Number(value) || "";
      const acc = accounts.find((a) => String(a.id) === String(selectedId));
      if (acc) {
        setForm((current) => ({
          ...current,
          account_id: String(selectedId),
          program_id: acc.programId ? String(acc.programId) : "",
          program_name: acc.programName ?? acc.displayName ?? "",
        }));
        return;
      }
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleCardParticipant() {
    setForm((current) => ({
      ...current,
      card_participant_program: !current.card_participant_program,
    }));
  }

  useEffect(() => {
    if (form.payment_method !== "card" && form.card_participant_program) {
      setForm((current) => ({ ...current, card_participant_program: false }));
    }
  }, [form.payment_method, form.card_participant_program]);

  useEffect(() => {
    if (!isOpen) {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAccounts() {
      setAccountsLoading(true);
      setErrors((current) => ({ ...current, account_id: "" }));

      try {
        const response = await fetch("/api/accounts", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || "Falha ao carregar contas");
        }

        const list = Array.isArray(payload?.items) ? payload.items : [];

        if (!cancelled) {
          setAccounts(
            list
              .filter((account: any) => account?.id)
              .map((account: any) => ({
                id: Number(account.id),
                displayName:
                  account.displayName ||
                  account.nickname ||
                  account.name ||
                  "Conta",
                balance: Number(account.balance || 0),
                isActive: Boolean(account.isActive ?? true),
                programId: account.programId ?? null,
                programName: account.program ?? account.programName ?? null,
              })),
          );
        }
      } catch {
        if (!cancelled) {
          setAccounts([]);
          setErrors((current) => ({
            ...current,
            account_id: "Nenhuma conta cadastrada disponível",
          }));
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const partRes = await fetch("/api/partner-stores");

        if (partRes.ok) {
          const j = await partRes.json().catch(() => null);
          if (Array.isArray(j)) {
            setPartnerStores(
              j.map((p: any) => ({
                id: p.id,
                name: p.name || p.title || String(p.id),
                logoUrl: p.logoUrl || p.logo_url || null,
              })),
            );
          }
        }
      } catch {
        // ignore
      }
    }

    loadOptions();
  }, []);

  function validate() {
    const err: Record<string, string> = {};
    if (!form.title || form.title.trim().length < 2) {
      err.title = "Informe o produto";
    }
    if (!form.payment_method) {
      err.payment_method = "Informe o método de compra";
    }
    if (!form.account_id) {
      err.account_id = "Selecione a conta destino";
    }
    const amount = Number(form.purchase_amount || 0);
    if (isNaN(amount) || amount <= 0) {
      err.purchase_amount = "Informe um valor maior que zero";
    }
    return err;
  }

  function selectPartnerStore(option: PartnerStoreOption) {
    setForm((current) => ({
      ...current,
      partner_store_id: String(option.id),
    }));
    setPartnerStoreOpen(false);
  }

  async function submit(e: any) {
    e.preventDefault();
    setErrors({});
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const payload = {
      organizationId,
      title: form.title,
      orderNumber: form.order_number || null,
      partnerStoreId: Number(form.partner_store_id) || null,
      accountId: Number(form.account_id) || null,
      programId: form.program_id ? Number(form.program_id) : null,
      purchaseAmountCents: Math.round(Number(form.purchase_amount || 0) * 100),
      multiplier: Number(form.multiplier) || 0,
      paymentMethod: form.payment_method,
      cardParticipantProgram: form.card_participant_program,
      purchaseDate: form.purchase_date || null,
      expectedCreditDate: form.expected_credit_date || null,
      notes: form.notes,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors({ submit: json?.error || "Falha ao criar compra" });
        return;
      }
      setOpen(false);
      onCreated?.();
      try {
        if (typeof window !== "undefined" && (window as any).dispatchEvent) {
          window.dispatchEvent(new CustomEvent("purchases:created"));
        }
      } catch {
        // no-op
      }
    } catch {
      setErrors({ submit: "Erro de rede" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={setOpen}>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-card active:scale-95"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
        </span>
        Nova Compra Bonificada
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Compra Bonificada</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Conta Destino
                </label>
                <Select
                  name="account_id"
                  value={form.account_id}
                  onChange={change}
                  disabled={accountsLoading}
                  className={
                    inputClass +
                    " disabled:cursor-not-allowed disabled:bg-slate-100"
                  }
                >
                  <option value="">
                    {accountsLoading
                      ? "Carregando contas..."
                      : "Selecione a conta destino"}
                  </option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName}
                      {account.balance > 0
                        ? ` • ${account.balance.toLocaleString("pt-BR")} pts`
                        : ""}
                    </option>
                  ))}
                </Select>
                {accountsLoading ? (
                  <div className="text-xs text-slate-500">
                    Buscando contas cadastradas.
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-xs text-amber-700">
                    Nenhuma conta cadastrada disponível.
                  </div>
                ) : errors.account_id ? (
                  <div className="text-xs text-rose-600">
                    {errors.account_id}
                  </div>
                ) : null}
              </div>

              {/* Programa (preenchido automaticamente a partir da conta) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Programa
                </label>
                <input
                  name="program_name"
                  value={form.program_name}
                  readOnly
                  disabled
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 outline-none transition"
                />
                {/* program_id é mantido apenas no state; não renderizamos input oculto */}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Loja Parceira
                </label>
                {partnerStores.length > 0 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPartnerStoreOpen((current) => !current)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {partnerStores.find(
                            (item) => String(item.id) === form.partner_store_id,
                          )?.logoUrl ? (
                            <img
                              src={
                                partnerStores.find(
                                  (item) =>
                                    String(item.id) === form.partner_store_id,
                                )?.logoUrl || undefined
                              }
                              alt={
                                partnerStores.find(
                                  (item) =>
                                    String(item.id) === form.partner_store_id,
                                )?.name || "Loja parceira"
                              }
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              LP
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-950">
                            {partnerStores.find(
                              (item) =>
                                String(item.id) === form.partner_store_id,
                            )?.name || "Selecione"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {partnerStores.find(
                              (item) =>
                                String(item.id) === form.partner_store_id,
                            )?.logoUrl || "Escolha a loja parceira"}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">▾</span>
                      </div>
                    </button>

                    {partnerStoreOpen ? (
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        {partnerStores.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectPartnerStore(option)}
                            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              {option.logoUrl ? (
                                <img
                                  src={option.logoUrl}
                                  alt={option.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">
                                  LP
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-950">
                                {option.name}
                              </div>
                              <div className="truncate text-xs text-slate-500">
                                {option.logoUrl || "Sem logo cadastrada"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {/* partner_store_id mantido no state via select; não renderizamos input oculto */}
                  </div>
                ) : (
                  <input
                    name="partner_store_id"
                    value={form.partner_store_id}
                    onChange={change}
                    className={inputClass}
                  />
                )}
              </div>

              {/* campo 'Campanha' removido por não ser necessário na UI */}

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Produto Adquirido
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={change}
                  className={inputClass}
                  placeholder="Ex: Camiseta, Passagem"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Valor da Compra (R$)
                </label>
                <input
                  name="purchase_amount"
                  value={form.purchase_amount}
                  onChange={change}
                  className={inputClass}
                  placeholder="Ex: 123.45"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Multiplicador (pts/R$)
                </label>
                <input
                  name="multiplier"
                  value={form.multiplier}
                  onChange={change}
                  className={inputClass}
                  placeholder="Ex: 1"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  numero do pedido
                </label>
                <input
                  name="order_number"
                  value={form.order_number}
                  onChange={change}
                  className={inputClass}
                  placeholder="Cole aqui o numero do pedido ou link direto para a compra no marketplace"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Método de compra
                </label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={change}
                  className={inputClass}
                >
                  <option value="card">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="transfer">Transferência</option>
                  <option value="cash">Dinheiro</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              {form.payment_method === "card" ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-950">
                      Acumula pontos
                    </div>
                    <div className="text-xs text-slate-500">
                      Ative quando a compra somar pontos no cartão participante.
                    </div>
                  </div>
                  <Switch
                    checked={form.card_participant_program}
                    onClick={toggleCardParticipant}
                    aria-label="Acumula pontos"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Data da Compra
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={form.purchase_date}
                  onChange={change}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Data Prevista de Crédito
                </label>
                <input
                  type="date"
                  name="expected_credit_date"
                  value={form.expected_credit_date}
                  onChange={change}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={change}
                  className="h-28 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400"
                />
              </div>
            </div>
            <hr className="border-slate-200" />
            {errors.submit ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errors.submit}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 ">
              <button
                type="button"
                className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-card active:scale-95"
                disabled={submitting || accountsLoading || !form.account_id}
              >
                {submitting ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
