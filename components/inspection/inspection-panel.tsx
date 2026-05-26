"use client";

import React, { useState } from "react";
import {
  buildNarrativeStatus,
  formatPoints,
  humanizeOperationalStatus,
  humanizeWarning,
} from "../financial/operational-guidance";

type Account = {
  id: number;
  nickname: string;
  program: string | null;
  balance: number;
};

type Props = {
  accounts: Account[];
};

export default function InspectionPanel({ accounts }: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [accountInspection, setAccountInspection] = useState<any | null>(null);
  const [fifoInspection, setFifoInspection] = useState<any | null>(null);
  const [replayInspection, setReplayInspection] = useState<any | null>(null);

  async function loadInspections(accountId: string) {
    setLoading(true);
    try {
      const [accountRes, fifoRes, replayRes] = await Promise.all([
        fetch(`/api/inspection/account?accountId=${accountId}`),
        fetch(`/api/inspection/fifo?accountId=${accountId}`),
        fetch(`/api/inspection/replay?accountId=${accountId}`),
      ]);

      const [accountJson, fifoJson, replayJson] = await Promise.all([
        accountRes.json(),
        fifoRes.json(),
        replayRes.json(),
      ]);

      setAccountInspection(accountJson?.inspection ?? null);
      setFifoInspection(fifoJson?.inspection ?? null);
      setReplayInspection(replayJson?.inspection ?? null);
    } finally {
      setLoading(false);
    }
  }

  const accountWarnings = accountInspection?.warnings ?? [];
  const fifoWarnings = fifoInspection?.warnings ?? [];
  const replayWarnings = replayInspection?.warnings ?? [];
  const accountStatus = humanizeOperationalStatus(
    accountInspection?.summary?.integrityStatus ?? "consistent",
  );
  const fifoStatus = humanizeOperationalStatus(
    fifoInspection?.summary?.fifoStatus ?? "consistent",
  );
  const replayStatus = humanizeOperationalStatus(
    replayInspection?.summary?.ledgerStatus ?? "consistent",
  );

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Inspeção operacional</h3>
        <p className="text-sm text-gray-600">
          Escolha uma conta para ver saúde operacional, warnings e replay em
          linguagem humana.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Conta</label>
        <select
          value={selectedAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">Selecione</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nickname} {account.program ? `— ${account.program}` : ""}{" "}
              — {formatPoints(account.balance)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            selectedAccountId && loadInspections(selectedAccountId)
          }
          disabled={!selectedAccountId || loading}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Carregando inspeção..." : "Inspecionar conta"}
        </button>
      </div>

      <HelpCard
        title="Como ler o replay"
        lines={[
          "Antes mostra o saldo anterior ao evento.",
          "Ação descreve o que aconteceu em linguagem operacional.",
          "Depois mostra saldo, lote e impacto final.",
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          title="Conta"
          status={accountStatus}
          rows={[
            {
              label: "Saldo operacional",
              value: formatPoints(
                accountInspection?.summary?.currentBalance ?? 0,
              ),
            },
            {
              label: "Saldo conciliado",
              value: formatPoints(
                accountInspection?.summary?.reconciledBalance ?? 0,
              ),
            },
            {
              label: "Divergência",
              value: formatPoints(accountInspection?.summary?.divergence ?? 0),
            },
            { label: "Warnings ativos", value: String(accountWarnings.length) },
          ]}
        />
        <SummaryCard
          title="FIFO"
          status={fifoStatus}
          rows={[
            {
              label: "Lotes totais",
              value: String(fifoInspection?.summary?.totalLots ?? 0),
            },
            {
              label: "Lotes problemáticos",
              value: String(
                (fifoInspection?.summary?.orphanLots ?? 0) +
                  (fifoInspection?.summary?.inconsistentLots ?? 0),
              ),
            },
            {
              label: "Consumo inválido",
              value: String(
                fifoInspection?.summary?.invalidRemainingPoints ?? 0,
              ),
            },
            { label: "Warnings ativos", value: String(fifoWarnings.length) },
          ]}
        />
        <SummaryCard
          title="Replay"
          status={replayStatus}
          rows={[
            {
              label: "Linha de replay",
              value: replayInspection?.summary?.ledgerStatus ?? "consistent",
            },
            {
              label: "Lineage íntegra",
              value: String(
                replayInspection?.summary?.brokenLineage === 0 ? "sim" : "não",
              ),
            },
            {
              label: "Inconsistências",
              value: String(
                replayInspection?.summary?.inconsistentEntries ?? 0,
              ),
            },
            { label: "Warnings ativos", value: String(replayWarnings.length) },
          ]}
        />
      </div>

      <section className="space-y-3 rounded border border-dashed p-3">
        <div className="text-sm font-semibold">Troubleshooting guiado</div>
        <TroubleshootingList
          warnings={[...accountWarnings, ...fifoWarnings, ...replayWarnings]}
        />
      </section>

      {replayInspection?.replay?.events?.length ? (
        <section className="space-y-2 rounded border p-3">
          <div className="text-sm font-semibold">Replay legível</div>
          <div className="text-sm text-gray-700">
            {buildNarrativeStatus(
              replayInspection?.summary?.ledgerStatus ?? "consistent",
              replayWarnings.length,
            )}
          </div>
          <div className="space-y-2">
            {replayInspection.replay.events.slice(0, 5).map((event: any) => (
              <div
                key={`${event.kind}-${event.id}`}
                className="rounded border bg-gray-50 p-3 text-sm"
              >
                <div className="font-medium">
                  {event.kind === "purchase"
                    ? "Compra"
                    : event.kind === "sale"
                      ? "Venda"
                      : event.kind === "transfer"
                        ? "Transferência"
                        : event.kind === "lot"
                          ? "Lote"
                          : "Evento"}
                </div>
                <div className="text-gray-700">
                  Quando: {new Date(event.occurredAt).toLocaleString("pt-BR")}
                </div>
                <div className="text-gray-700">
                  Pontos: {formatPoints(event.points ?? 0)}
                </div>
                <div className="text-gray-700">
                  Linha: {renderLineage(event)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  status,
  rows,
}: {
  title: string;
  status: { label: string; tone: string };
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded border bg-gray-50 p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
        {status.label}
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-2"
          >
            <dt className="text-gray-600">{row.label}</dt>
            <dd className="font-medium text-gray-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HelpCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
      <div className="font-semibold">{title}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function TroubleshootingList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return (
      <div className="text-sm text-gray-600">
        Nenhum warning ativo nesta inspeção.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warnings.map((warning) => {
        const guidance = humanizeWarning(warning);
        return (
          <div key={warning} className="rounded border bg-white p-3 text-sm">
            <div className="font-medium">{guidance.problem}</div>
            <div className="mt-1 text-gray-700">Impacto: {guidance.impact}</div>
            <div className="mt-1 text-gray-700">Ação: {guidance.action}</div>
            <div className="mt-1 text-gray-700">
              Quando escalar: {guidance.escalate}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderLineage(event: any): string {
  if (event.kind === "purchase") {
    return `saldo anterior → compra → lote criado com ${formatPoints(event.points ?? 0)}`;
  }

  if (event.kind === "sale") {
    return `saldo anterior → consumo FIFO → saldo reduzido em ${formatPoints(event.points ?? 0)}`;
  }

  if (event.kind === "transfer") {
    return `origem reduzida → destino aumentado → lineage preservada`;
  }

  if (event.kind === "lot") {
    return `lote operacional com rastreabilidade preservada`;
  }

  return "evento operacional registrado";
}
