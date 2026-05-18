"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: number;
  nickname: string;
  program: string | null;
  balance: number;
};

export default function TransferForm({ accounts }: { accounts: Account[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const from = fd.get("fromAccountId")?.toString();
    const to = fd.get("toAccountId")?.toString();
    if (from === to) {
      setMessage("Conta origem e destino não podem ser iguais.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/transfers", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.success) {
        setMessage("Transferência criada com sucesso.");
        form.reset();
        router.refresh();
      } else {
        setMessage(
          "Erro: " + (data?.error || JSON.stringify(data?.errors || {})),
        );
      }
    } catch (err: any) {
      setMessage("Erro ao criar transferência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded border space-y-2"
    >
      <h3 className="font-semibold">Nova Transferência</h3>
      <div>
        <label className="text-sm">Origem</label>
        <select name="fromAccountId" required className="w-full">
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
        <label className="text-sm">Destino</label>
        <select name="toAccountId" required className="w-full">
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
        <label className="text-sm">Pontos enviados</label>
        <input
          name="pointsSent"
          type="number"
          required
          min="1"
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm">Bônus (%)</label>
        <input
          name="bonusPercent"
          type="number"
          step="0.1"
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm">Taxa (R$)</label>
        <input name="fee" type="number" step="0.01" className="w-full" />
      </div>
      <div>
        <label className="text-sm">Data</label>
        <input name="transferredAt" type="datetime-local" className="w-full" />
      </div>
      <div>
        <label className="text-sm">Observação (opcional)</label>
        <input name="description" type="text" className="w-full" />
      </div>
      <div>
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Enviando..." : "Criar Transferência"}
        </button>
      </div>
      {message && <div className="text-sm text-gray-700">{message}</div>}
    </form>
  );
}
