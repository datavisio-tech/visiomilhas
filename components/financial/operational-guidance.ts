export type WarningGuide = {
  severity: "INFO" | "WARNING" | "CRITICAL";
  priority: "baixa" | "média" | "alta";
  impactArea: string;
  problem: string;
  impact: string;
  action: string;
  escalate: string;
};

export type OperationalStatus = "consistent" | "warning" | "broken";

export function formatPoints(value: number): string {
  return `${Number(value || 0).toLocaleString("pt-BR")} pts`;
}

export function formatMoneyCents(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0) / 100);
}

export function humanizeOperationalStatus(status: OperationalStatus): {
  label: string;
  tone: "ok" | "attention" | "critical";
} {
  if (status === "consistent")
    return { label: "Operação saudável", tone: "ok" };
  if (status === "warning")
    return { label: "Atenção operacional", tone: "attention" };
  return { label: "Operação crítica", tone: "critical" };
}

export function humanizeWarning(message: string): WarningGuide {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("divergência de saldo") ||
    normalized.includes("saldo negativo") ||
    normalized.includes("saldo impossível")
  ) {
    return {
      severity: "CRITICAL",
      priority: "alta",
      impactArea: "saldo, replay e reconciliation",
      problem: "Divergência detectada entre saldo e lotes.",
      impact: "O saldo pode não fechar com o histórico operacional.",
      action:
        "Recomendo executar a reconciliação e revisar os últimos lançamentos.",
      escalate: "Escale se a divergência continuar após a reconciliação.",
    };
  }

  if (
    normalized.includes("lote órfão") ||
    normalized.includes("account orfã")
  ) {
    return {
      severity: "WARNING",
      priority: "média",
      impactArea: "lineage e replay",
      problem: "Lote sem rastreabilidade detectado.",
      impact: "O replay pode ficar incompleto ou difícil de interpretar.",
      action: "Abra a inspeção da conta e confirme a origem do lote.",
      escalate:
        "Escale se o lote não puder ser vinculado a uma operação válida.",
    };
  }

  if (
    normalized.includes("consumo inválido") ||
    normalized.includes("remaining points inválido")
  ) {
    return {
      severity: "WARNING",
      priority: "média",
      impactArea: "FIFO e lineage",
      problem: "Consumo FIFO inválido detectado.",
      impact: "O lote consumido pode não refletir o estoque real.",
      action: "Revise a sequência de consumo e valide os lotes recentes.",
      escalate:
        "Escale se a sequência não puder ser reconciliada com o replay.",
    };
  }

  if (
    normalized.includes("delta inválido") ||
    normalized.includes("timeline impossível") ||
    normalized.includes("replay divergente")
  ) {
    return {
      severity: "CRITICAL",
      priority: "alta",
      impactArea: "replay e reconciliation",
      problem: "Replay inconsistente detectado.",
      impact:
        "A sequência operacional pode ter eventos fora de ordem ou duplicados.",
      action:
        "Valide o replay e compare os eventos com o lançamento mais recente.",
      escalate:
        "Escale se houver eventos faltantes ou duplicados após a validação.",
    };
  }

  return {
    severity: "INFO",
    priority: "baixa",
    impactArea: "operacional",
    problem: message,
    impact: "Este aviso pode afetar a leitura operacional do fluxo financeiro.",
    action: "Abra a inspeção da conta e revise os últimos eventos.",
    escalate: "Escale se bloquear compra, venda ou transferência.",
  };
}

export function buildNarrativeStatus(
  status: OperationalStatus,
  warningCount: number,
): string {
  if (status === "broken") return `status crítico com ${warningCount} aviso(s)`;
  if (status === "warning")
    return `status em atenção com ${warningCount} aviso(s)`;
  return "status saudável";
}
