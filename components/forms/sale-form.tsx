"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: number;
  nickname: string;
  program: string | null;
  balance: number;
};

export default function SaleForm({ accounts }: { accounts: Account[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const total = fd.get("total") as string;
    const cents = Math.round(Number(total || 0) * 100);
    fd.set("totalAmountCents", String(cents));

    try {
      const res = await fetch("/api/sales", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.success) {
        setMessage("Venda criada com sucesso.");
        form.reset();
        router.refresh();
      } else {
        setMessage(
          "Erro: " + (data?.error || JSON.stringify(data?.errors || {})),
        );
      }
    } catch (err: any) {
      setMessage("Erro ao criar venda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded border space-y-2"
    >
      <h3 className="font-semibold">Nova Venda</h3>
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
        <label className="text-sm">Valor total (R$)</label>
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
        <input name="soldAt" type="datetime-local" className="w-full" />
      </div>
      <div>
        <label className="text-sm">Cliente (opcional)</label>
        <input name="customerName" type="text" className="w-full" />
      </div>
      <div>
        <label className="text-sm">Descrição (opcional)</label>
        <input name="description" type="text" className="w-full" />
      </div>
      <div>
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Enviando..." : "Criar Venda"}
        </button>
      </div>
      {message && <div className="text-sm text-gray-700">{message}</div>}
    </form>
  );
}
