"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatMoneyCents,
  formatPoints,
  humanizeOperationalStatus,
  prioritizeWarnings,
} from "../financial/operational-guidance";

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
  const [replayInspection, setReplayInspection] = useState<any | null>(null);
  const [operation, setOperation] = useState<any | null>(null);
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
        setOperation(data);
        setMessage(
          `Transferência operacional concluída. Origem ${formatPoints(data.previousOriginBalance)} → ${formatPoints(data.newOriginBalance)}; destino ${formatPoints(data.previousDestinationBalance)} → ${formatPoints(data.newDestinationBalance)}.`,
        );
        form.reset();
        router.refresh();
        try {
          const from = fd.get("fromAccountId")?.toString();
          const to = fd.get("toAccountId")?.toString();
          if (from && to) {
            const [fromResponse, toResponse, replayResponse] =
              await Promise.all([
                fetch(`/api/inspection/account?accountId=${from}`),
                fetch(`/api/inspection/account?accountId=${to}`),
                fetch(`/api/inspection/replay?accountId=${from}`),
              ]);
            const fromJson = await fromResponse.json();
            const toJson = await toResponse.json();
            const replayJson = await replayResponse.json();
            if (fromJson?.success) setInspectionFrom(fromJson.inspection);
            if (toJson?.success) setInspectionTo(toJson.inspection);
            if (replayJson?.success) setReplayInspection(replayJson.inspection);
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
      {operation && (
        <section className="space-y-3 rounded border bg-gray-50 p-3">
          <div className="font-semibold">Replay de transferência</div>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <NarrativeBox
              title="ORIGEM"
              lines={[
                `Saldo antes: ${formatPoints(operation.previousOriginBalance)}`,
                `Saldo depois: ${formatPoints(operation.newOriginBalance)}`,
                `Custo origem: ${formatMoneyCents(operation.originCpmCents)}`,
              ]}
            />
            <NarrativeBox
              title="AÇÃO"
              lines={[
                `Pontos enviados: ${formatPoints(operation.pointsSent)}`,
                `Pontos recebidos: ${formatPoints(operation.pointsReceived)}`,
                `Bônus aplicado: ${operation.bonusPercent}%`,
              ]}
            />
            <NarrativeBox
              title="DESTINO"
              lines={[
                `Saldo antes: ${formatPoints(operation.previousDestinationBalance)}`,
                `Saldo depois: ${formatPoints(operation.newDestinationBalance)}`,
                `Custo destino: ${formatMoneyCents(operation.destinationCpmCents)}`,
              ]}
            />
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="font-medium">Lineage simplificada</div>
            <div className="mt-1 text-gray-700">
              Origem reduzida em {formatPoints(operation.pointsSent)} e destino
              aumentado em {formatPoints(operation.pointsReceived)}.
            </div>
          </div>
        </section>
      )}
      {false && (inspectionFrom || inspectionTo) && (
        <div className="space-y-3 rounded border bg-gray-50 p-3">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded border bg-white p-3">
              <div className="font-semibold">Origem</div>
              {inspectionFrom ? (
                <>
                  <div className="text-gray-700">
                    {
                      humanizeOperationalStatus(
                        inspectionFrom.summary.integrityStatus,
                      ).label
                    }
                  </div>
                  <div className="text-gray-700">
                    Saldo: {formatPoints(inspectionFrom.summary.currentBalance)}
                  </div>
                  <div className="text-gray-700">
                    Divergência:{" "}
                    {formatPoints(inspectionFrom.summary.divergence)}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">—</div>
              )}
            </div>
            <div className="rounded border bg-white p-3">
              <div className="font-semibold">Destino</div>
              {inspectionTo ? (
                <>
                  <div className="text-gray-700">
                    {
                      humanizeOperationalStatus(
                        inspectionTo.summary.integrityStatus,
                      ).label
                    }
                  </div>
                  <div className="text-gray-700">
                    Saldo: {formatPoints(inspectionTo.summary.currentBalance)}
                  </div>
                  <div className="text-gray-700">
                    Divergência: {formatPoints(inspectionTo.summary.divergence)}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">—</div>
              )}
            </div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="font-medium">Replay simplificado</div>
            <div className="mt-1 text-gray-700">
              {replayInspection?.replay?.events?.length
                ? `Linha operacional com ${replayInspection.replay.events.length} evento(s) e lineage preservada.`
                : "Nenhum replay carregado."}
            </div>
          </div>
          <WarningStack
            warnings={[
              ...(inspectionFrom?.warnings ?? []),
              ...(inspectionTo?.warnings ?? []),
            ]}
          />
        </div>
      )}
    </form>
  );
}

function NarrativeBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="mt-2 space-y-1 text-sm text-gray-700">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function WarningStack({ warnings }: { warnings: string[] }) {
  const prioritized = prioritizeWarnings(warnings);

  if (!prioritized.length) {
    return <div className="text-sm text-gray-600">Nenhum warning ativo.</div>;
  }

  const visibleWarnings = prioritized.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Warnings humanizados</div>
      {visibleWarnings.map((guidance) => {
        return (
          <div
            key={`${guidance.problem}-${guidance.severity}`}
            className="rounded border bg-white p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{guidance.problem}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {guidance.severity} • prioridade {guidance.priority}
              </div>
            </div>
            <div className="mt-1 text-gray-700">
              Impacto: {guidance.impactArea}
            </div>
            <div className="mt-1 text-gray-700">Impacto: {guidance.impact}</div>
            <div className="mt-1 text-gray-700">Ação: {guidance.action}</div>
            <div className="mt-1 text-gray-700">
              Escalar: {guidance.escalate}
            </div>
          </div>
        );
      })}
      {prioritized.length > visibleWarnings.length ? (
        <div className="text-xs text-gray-500">
          +{prioritized.length - visibleWarnings.length} warning(s)
          adicional(is) oculto(s) para reduzir ruído.
        </div>
      ) : null}
    </div>
  );
}
