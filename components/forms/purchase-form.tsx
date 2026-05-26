"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: number;
  nickname: string;
  program: string | null;
  balance: number;
  cpmCents?: number;
};

export default function PurchaseForm({ accounts }: { accounts: Account[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inspection, setInspection] = useState<any | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const total = fd.get("total") as string;
    const cents = Math.round(Number(total || 0) * 100);
    fd.set("totalCostCents", String(cents));

    try {
      const res = await fetch("/api/purchases", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.success) {
        setMessage("Compra criada com sucesso.");
        form.reset();
          router.refresh();
          // fetch inspection summary for the account to show operational feedback
          try {
            const accountId = fd.get("accountId")?.toString();
            if (accountId) {
              const r = await fetch(`/api/inspection/account?accountId=${accountId}`);
              const j = await r.json();
              if (j?.success) setInspection(j.inspection);
            }
          } catch (err) {
            // ignore
          }
      } else {
        setMessage(
          "Erro: " + (data?.error || JSON.stringify(data?.errors || {})),
        );
      }
    } catch (err: any) {
      setMessage("Erro ao criar compra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded border space-y-2"
    >
      <h3 className="font-semibold">Nova Compra</h3>
      <div>
        <label className="text-sm">Conta</label>
        <select name="accountId" required className="w-full">
          <option value="">Selecione</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nickname} {a.program ? ` — ${a.program}` : ""} — {a.balance}{" "}
              pts
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm">Pontos</label>
        <input
          name="points"
          type="number"
          required
          min="1"
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm">Valor (R$)</label>
        <input
          name="total"
          type="number"
          step="0.01"
          required
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm">Data</label>
        <input name="purchasedAt" type="datetime-local" className="w-full" />
      </div>
      <div>
        <label className="text-sm">Descrição (opcional)</label>
        <input name="description" type="text" className="w-full" />
      </div>
      <div>
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Enviando..." : "Criar Compra"}
        </button>
      </div>
      {message && <div className="text-sm text-gray-700">{message}</div>}
      {inspection && (
        <div className="mt-2 bg-gray-50 p-3 rounded border">
          <div className="font-semibold">Resultado operacional</div>
          <div className="text-sm">Saldo atual: {inspection.summary.currentBalance}</div>
          <div className="text-sm">Saldo conciliado: {inspection.summary.reconciledBalance}</div>
          <div className="text-sm">Divergência: {inspection.summary.divergence}</div>
          <div className="text-sm">Status: {inspection.summary.integrityStatus}</div>
          {inspection.warnings && inspection.warnings.length > 0 && (
            <div className="mt-2 text-sm text-yellow-700">
              Warnings: {inspection.warnings.map((w: any) => w.message).join("; ")}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
