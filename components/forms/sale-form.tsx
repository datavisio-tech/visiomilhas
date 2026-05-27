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

export default function SaleForm({ accounts }: { accounts: Account[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inspection, setInspection] = useState<any | null>(null);
  const [replayInspection, setReplayInspection] = useState<any | null>(null);
  const [operation, setOperation] = useState<any | null>(null);
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
        setOperation(data);
        setMessage(
          `Venda operacional concluída. Saldo anterior ${formatPoints(data.previousBalance)} → saldo atual ${formatPoints(data.newBalance)}.`,
        );
        form.reset();
        router.refresh();
        try {
          const accountId = fd.get("accountId")?.toString();
          if (accountId) {
            const [fifoResponse, replayResponse] = await Promise.all([
              fetch(`/api/inspection/fifo?accountId=${accountId}`),
              fetch(`/api/inspection/replay?accountId=${accountId}`),
            ]);
            const fifoJson = await fifoResponse.json();
            const replayJson = await replayResponse.json();
            if (fifoJson?.success) setInspection(fifoJson.inspection);
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
      {operation && (
        <section className="space-y-3 rounded border bg-gray-50 p-3">
          <div className="font-semibold">Replay de venda</div>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <NarrativeBox
              title="ANTES"
              lines={[
                `Saldo anterior: ${formatPoints(operation.previousBalance)}`,
                `CPM anterior: ${formatMoneyCents(operation.currentCpmCents)}`,
              ]}
            />
            <NarrativeBox
              title="AÇÃO"
              lines={[
                `Consumo FIFO: ${formatPoints(operation.pointsSold)}`,
                `Custo real: ${formatMoneyCents(operation.costBaseCents)}`,
                `Margem: ${formatMoneyCents(operation.profitCents)}`,
              ]}
            />
            <NarrativeBox
              title="DEPOIS"
              lines={[
                `Saldo restante: ${formatPoints(operation.newBalance)}`,
                `CPM preservado: ${formatMoneyCents(operation.currentCpmCents)}`,
              ]}
            />
          </div>
        </section>
      )}
      {false && inspection && (
        <div className="space-y-3 rounded border bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">Resultado FIFO</div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {humanizeOperationalStatus(inspection.summary.fifoStatus).label}
            </div>
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <MetricBox
              label="Lotes totais"
              value={String(inspection.summary.totalLots)}
            />
            <MetricBox
              label="Lotes problemáticos"
              value={String(
                inspection.summary.orphanLots +
                  inspection.summary.inconsistentLots,
              )}
            />
            <MetricBox
              label="Consumo inválido"
              value={String(inspection.summary.invalidRemainingPoints)}
            />
          </div>
          <ReplaySummary
            title="Lotes consumidos e lineage"
            items={
              replayInspection?.lineage?.nodes
                ?.filter((node: any) => node.operationKind === "sale")
                ?.slice(0, 5)
                ?.map(
                  (node: any) =>
                    `Lote ${node.lotId} consumiu ${formatPoints(node.consumedPoints)} e deixou ${formatPoints(node.remainingPoints)}`,
                ) ?? []
            }
          />
          <ReplaySummary
            title="Replay simplificado"
            items={
              replayInspection?.replay?.events
                ?.filter(
                  (event: any) => event.kind === "sale" || event.kind === "lot",
                )
                ?.slice(0, 3)
                ?.map(
                  (event: any) =>
                    `${event.kind === "sale" ? "Venda" : "Lote"} em ${new Date(event.occurredAt).toLocaleString("pt-BR")} - ${formatPoints(event.points ?? 0)}`,
                ) ?? []
            }
          />
          <WarningStack warnings={inspection?.warnings ?? []} />
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ReplaySummary({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-sm font-medium">{title}</div>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-sm text-gray-500">
          Nenhum replay relevante encontrado.
        </div>
      )}
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
