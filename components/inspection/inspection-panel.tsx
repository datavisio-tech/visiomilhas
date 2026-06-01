"use client";

import React, { useState } from "react";
import {
  buildNarrativeStatus,
  formatPoints,
  humanizeOperationalStatus,
  prioritizeWarnings,
} from "../financial/operational-guidance";

type RecoveryWorkflow =
  | "balance-reconcile"
  | "replay-reconcile"
  | "fifo-reconcile"
  | "lineage-rebuild";

type RecoveryResult = {
  workflow: RecoveryWorkflow;
  title: string;
  status: "consistent" | "warning" | "broken";
  warningCount: number;
  warnings: string[];
  recoveryAction: string;
  nextStep: string;
  escalation: string;
  executedAt: string;
  actorUserId: string;
  actorEmail?: string | null;
  details: Record<string, unknown>;
};

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
  const [recoveryLoading, setRecoveryLoading] = useState<RecoveryWorkflow | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

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
  const prioritizedWarnings = prioritizeWarnings([
    ...accountWarnings,
    ...fifoWarnings,
    ...replayWarnings,
  ]);
  const accountStatus = humanizeOperationalStatus(
    accountInspection?.summary?.integrityStatus ?? "consistent",
  );
  const fifoStatus = humanizeOperationalStatus(
    fifoInspection?.summary?.fifoStatus ?? "consistent",
  );
  const replayStatus = humanizeOperationalStatus(
    replayInspection?.summary?.ledgerStatus ?? "consistent",
  );

  async function executeRecovery(workflow: RecoveryWorkflow) {
    if (!selectedAccountId) return;

    setRecoveryLoading(workflow);
    setRecoveryError(null);

    try {
      const response = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow, accountId: Number(selectedAccountId) }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Falha ao executar recovery");
      }

      setRecoveryResult(payload.recovery as RecoveryResult);
      await loadInspections(selectedAccountId);
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : String(error));
    } finally {
      setRecoveryLoading(null);
    }
  }

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
        title="Replay e lineage"
        lines={[
          "Antes mostra o saldo anterior.",
          "Ação mostra o que mudou.",
          "Depois mostra saldo, CPM e impacto final.",
        ]}
      />

      <HelpCard
        title="Ajuda operacional rápida"
        lines={[
          "Replay: leia antes → ação → depois.",
          "Lineage: pontos saem de um lugar e chegam em outro.",
          "Drift: compare saldo operacional com saldo conciliado.",
          "Reconcile: use quando saldo e lotes não fecharem.",
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
            {
              label: "Risco operacional",
              value: riskFromStatus(
                accountInspection?.summary?.integrityStatus ?? "consistent",
                accountWarnings.length,
              ),
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
            {
              label: "Problemas críticos",
              value: String(
                (fifoInspection?.summary?.orphanLots ?? 0) +
                  (fifoInspection?.summary?.inconsistentLots ?? 0) +
                  (fifoInspection?.summary?.invalidRemainingPoints ?? 0),
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
            {
              label: "Risco operacional",
              value: riskFromStatus(
                replayInspection?.summary?.ledgerStatus ?? "consistent",
                replayWarnings.length,
              ),
            },
            { label: "Warnings ativos", value: String(replayWarnings.length) },
          ]}
        />
      </div>

      <section className="space-y-3 rounded border border-dashed p-3">
        <div className="text-sm font-semibold">Troubleshooting guiado</div>
        <div className="text-xs uppercase tracking-wide text-gray-500">
          VER → ENTENDER → AGIR → ESCALAR
        </div>
        <TroubleshootingList warnings={prioritizedWarnings} />
      </section>

      <section className="space-y-3 rounded border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-amber-950">
              Workflows de recuperação
            </div>
            <div className="text-xs text-amber-900">
              Ações explícitas, auditáveis e sem remediação silenciosa.
            </div>
          </div>
          <button
            type="button"
            onClick={() => selectedAccountId && loadInspections(selectedAccountId)}
            disabled={!selectedAccountId || loading}
            className="rounded border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Validar novamente
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <RecoveryButton
            label="Reconcile saldo"
            description="Corrige divergência entre saldo operacional e lotes conciliados."
            onClick={() => executeRecovery("balance-reconcile")}
            loading={recoveryLoading === "balance-reconcile"}
            disabled={!selectedAccountId}
          />
          <RecoveryButton
            label="Reconcile replay"
            description="Revalida a linha temporal e o vínculo com o histórico operacional."
            onClick={() => executeRecovery("replay-reconcile")}
            loading={recoveryLoading === "replay-reconcile"}
            disabled={!selectedAccountId}
          />
          <RecoveryButton
            label="Reconcile FIFO"
            description="Revê a ordem de consumo e a coerência dos lotes."
            onClick={() => executeRecovery("fifo-reconcile")}
            loading={recoveryLoading === "fifo-reconcile"}
            disabled={!selectedAccountId}
          />
          <RecoveryButton
            label="Rebuild lineage"
            description="Reconstrói a trilha operacional para localizar a origem dos eventos."
            onClick={() => executeRecovery("lineage-rebuild")}
            loading={recoveryLoading === "lineage-rebuild"}
            disabled={!selectedAccountId}
          />
        </div>

        <div className="grid gap-2 text-sm text-amber-950 md:grid-cols-3">
          <div className="rounded border border-amber-200 bg-white p-3">
            <div className="font-medium">Quando reconciliar</div>
            <div className="mt-1">
              Quando saldo e lotes não fecharem ou houver drift operacional detectado.
            </div>
          </div>
          <div className="rounded border border-amber-200 bg-white p-3">
            <div className="font-medium">Quando rebuildar</div>
            <div className="mt-1">
              Quando replay ou lineage não explicarem a origem dos eventos com clareza.
            </div>
          </div>
          <div className="rounded border border-amber-200 bg-white p-3">
            <div className="font-medium">Quando escalar engenharia</div>
            <div className="mt-1">
              Quando a inconsistência persistir após a recuperação explícita e a validação final.
            </div>
          </div>
        </div>

        {recoveryError ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {recoveryError}
          </div>
        ) : null}

        {recoveryResult ? (
          <div className="rounded border border-amber-200 bg-white p-3 text-sm text-amber-950">
            <div className="font-semibold">Última recuperação</div>
            <div className="mt-1">{recoveryResult.title}</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <AuditLine
                label="Executado em"
                value={new Date(recoveryResult.executedAt).toLocaleString("pt-BR")}
              />
              <AuditLine
                label="Operador"
                value={recoveryResult.actorEmail ?? recoveryResult.actorUserId}
              />
              <AuditLine label="Status" value={recoveryResult.status} />
              <AuditLine
                label="Warnings afetados"
                value={String(recoveryResult.warningCount)}
              />
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <span className="font-medium">Ação executada:</span>{" "}
                {recoveryResult.recoveryAction}
              </div>
              <div>
                <span className="font-medium">Próximo passo:</span>{" "}
                {recoveryResult.nextStep}
              </div>
              <div>
                <span className="font-medium">Escalonamento:</span>{" "}
                {recoveryResult.escalation}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded border bg-green-50 p-3 text-sm text-green-900">
        <div className="font-semibold">Sinais de confiança operacional</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Replay: {replayInspection?.summary?.ledgerStatus === "consistent" ? "estável" : "em atenção"}
          </li>
          <li>
            Lineage: {replayInspection?.summary?.brokenLineage === 0 ? "íntegra" : "com ajustes pendentes"}
          </li>
          <li>
            Warnings relevantes: {prioritizedWarnings.length}
          </li>
          <li>
            Estado geral: {prioritizedWarnings.length === 0 ? "previsível e estável" : "monitorado com ação guiada"}
          </li>
        </ul>
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
                <div className="font-medium">{renderEventHeadline(event)}</div>
                <div className="mt-1 text-gray-700">{renderEventNarrative(event)}</div>
                <div className="mt-1 text-gray-700">{renderLineage(event)}</div>
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

function RecoveryButton({
  label,
  description,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded border border-amber-300 bg-white p-3 text-left text-sm text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="font-medium">{loading ? "Executando..." : label}</div>
      <div className="mt-1 text-xs text-amber-900">{description}</div>
    </button>
  );
}

function AuditLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-amber-100 bg-amber-50 p-2">
      <div className="text-xs uppercase tracking-wide text-amber-700">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
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

function TroubleshootingList({ warnings }: { warnings: ReturnType<typeof prioritizeWarnings> }) {
  if (!warnings.length) {
    return (
      <div className="text-sm text-gray-600">
        Nenhum warning ativo nesta inspeção.
      </div>
    );
  }

  const visibleWarnings = warnings.slice(0, 5);

  return (
    <div className="space-y-3">
      {visibleWarnings.map((guidance) => {
        return (
          <div key={`${guidance.problem}-${guidance.severity}`} className="rounded border bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{guidance.problem}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {guidance.severity} • prioridade {guidance.priority}
              </div>
            </div>
            <div className="mt-1 text-gray-700">Impacto: {guidance.impactArea}</div>
            <div className="mt-1 text-gray-700">Impacto: {guidance.impact}</div>
            <div className="mt-1 text-gray-700">Ação: {guidance.action}</div>
            <div className="mt-1 text-gray-700">Recuperação: {guidance.recoveryAction}</div>
            <div className="mt-1 text-gray-700">
              Quando escalar: {guidance.escalate}
            </div>
            <div className="mt-2 text-xs uppercase tracking-wide text-gray-500">
              Ver: warning localizado no painel. Entender: leia impacto e ação.
            </div>
          </div>
        );
      })}
      {warnings.length > visibleWarnings.length ? (
        <div className="text-xs text-gray-500">
          +{warnings.length - visibleWarnings.length} warning(s) adicional(is) oculto(s) para evitar fadiga operacional.
        </div>
      ) : null}
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

function renderEventHeadline(event: any): string {
  if (event.kind === "purchase") return "Compra processada";
  if (event.kind === "sale") return "Venda consumida";
  if (event.kind === "transfer") return "Transferência concluída";
  if (event.kind === "lot") return "Lote operacional";
  return "Evento operacional";
}

function renderEventNarrative(event: any): string {
  if (event.kind === "purchase") return `Saldo anterior e saldo atualizado: ${formatPoints(event.points ?? 0)}.`;
  if (event.kind === "sale") return `Consumo FIFO e custo real aplicados sobre ${formatPoints(event.points ?? 0)}.`;
  if (event.kind === "transfer") return `Origem e destino ajustados com impacto operacional preservado.`;
  if (event.kind === "lot") return `Lote criado com rastreabilidade preservada.`;
  return "Evento registrado para auditoria operacional.";
}

function riskFromStatus(status: string, warningCount: number): string {
  if (status === "broken" || warningCount > 1) return "alto";
  if (status === "warning" || warningCount === 1) return "médio";
  return "baixo";
}
