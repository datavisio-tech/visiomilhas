import { NextResponse } from "next/server";
import { appPool } from "../../../db/app/client";
import {
  executeFinancialRecoveryWorkflow,
  type FinancialRecoveryWorkflow,
} from "../../../lib/server/financial-integrity";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";

const allowedWorkflows: FinancialRecoveryWorkflow[] = [
  "balance-reconcile",
  "replay-reconcile",
  "fifo-reconcile",
  "lineage-rebuild",
];

export async function POST(req: Request) {
  const sessionContext = await resolveControlledSessionContext({
    source: "financial.recovery.api",
    allowFallback: false,
  });

  if (!sessionContext) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { workflow?: string; accountId?: number | string | null }
    | null;

  const workflow = body?.workflow;
  const accountId = Number(body?.accountId);

  if (!workflow || !allowedWorkflows.includes(workflow as FinancialRecoveryWorkflow)) {
    return NextResponse.json(
      { error: "invalid workflow" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return NextResponse.json(
      { error: "invalid accountId" },
      { status: 400 },
    );
  }

  const organizationId = sessionContext.ownership.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "organization missing" }, { status: 400 });
  }

  const pool = appPool();
  const client = await pool.connect();

  try {
    const recovery = await executeFinancialRecoveryWorkflow(client as any, {
      workflow: workflow as FinancialRecoveryWorkflow,
      organizationId,
      accountId,
      actorUserId: sessionContext.auth.userId,
      actorEmail: sessionContext.auth.email ?? null,
      source: "financial.recovery.api",
    });

    return NextResponse.json({
      success: true,
      recovery,
    });
  } finally {
    client.release();
  }
}
