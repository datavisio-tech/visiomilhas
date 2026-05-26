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

export default function TransferForm({ accounts }: { accounts: Account[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inspectionFrom, setInspectionFrom] = useState<any | null>(null);
  const [inspectionTo, setInspectionTo] = useState<any | null>(null);
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
        try {
          const from = fd.get("fromAccountId")?.toString();
          const to = fd.get("toAccountId")?.toString();
          if (from) {
            const r = await fetch(`/api/inspection/account?accountId=${from}`);
            const j = await r.json();
            if (j?.success) setInspectionFrom(j.inspection);
          }
          if (to) {
            const r2 = await fetch(`/api/inspection/account?accountId=${to}`);
            const j2 = await r2.json();
            if (j2?.success) setInspectionTo(j2.inspection);
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
      {(inspectionFrom || inspectionTo) && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded border">
            <div className="font-semibold">Origem</div>
            {inspectionFrom ? (
              <>
                <div className="text-sm">Saldo: {inspectionFrom.summary.currentBalance}</div>
                <div className="text-sm">Divergência: {inspectionFrom.summary.divergence}</div>
              </>
            ) : (
              <div className="text-sm">—</div>
            )}
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="font-semibold">Destino</div>
            {inspectionTo ? (
              <>
                <div className="text-sm">Saldo: {inspectionTo.summary.currentBalance}</div>
                <div className="text-sm">Divergência: {inspectionTo.summary.divergence}</div>
              </>
            ) : (
              <div className="text-sm">—</div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
