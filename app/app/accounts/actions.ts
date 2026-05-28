"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appPool } from "../../../db/app/client";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { requireAuth } from "../../../lib/server/auth-context";
import { resolveOwnedAccount } from "../../../lib/server/ownership-resolvers";
import {
  calculateInitialCostBasisCents,
  buildAccountDisplayName,
} from "../../../lib/accounts";

const accountFormSchema = z.object({
  programId: z.coerce.number().int().positive(),
  nickname: z.string().trim().max(255).optional().or(z.literal("")),
  initialBalance: z.coerce.number().int().min(0).optional().default(0),
  initialCpm: z.coerce.number().min(0).optional().default(0),
  addInitialBalance: z
    .union([z.literal("on"), z.literal("true"), z.literal("1")])
    .optional(),
  accountId: z.coerce.number().int().positive().optional(),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("1")])
    .optional(),
  mode: z
    .enum(["create", "edit", "adjust", "inactive", "delete"])
    .default("create"),
});

function normalizeNickname(value?: string | null) {
  const nickname = value?.trim();
  return nickname ? nickname : null;
}

async function writeInitialBalanceEntry(params: {
  client: any;
  organizationId: number;
  programId: number;
  accountId: number;
  balance: number;
  cpmCents: number;
  description?: string | null;
}) {
  const costBasisCents = calculateInitialCostBasisCents(
    params.balance,
    params.cpmCents,
  );

  if (params.balance <= 0) {
    return;
  }

  await params.client.query(
    `INSERT INTO mile_entries (
      organization_id,
      program_id,
      account_id,
      type,
      category,
      direction,
      points,
      amount_cents,
      cost_basis_cents,
      cost_per_thousand_cents,
      occurred_at,
      description,
      source,
      status,
      created_at,
      updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,NOW(),NOW())`,
    [
      params.organizationId,
      params.programId,
      params.accountId,
      "INITIAL_BALANCE",
      "seed operation",
      "in",
      params.balance,
      costBasisCents,
      costBasisCents,
      params.cpmCents,
      params.description ?? "Saldo inicial da conta",
      "manual_seed",
      "completed",
    ],
  );
}

function getProgramDisplayName(programName: string | null | undefined) {
  return (programName ?? "Programa").trim() || "Programa";
}

export async function createAccountAction(formData: FormData) {
  const parsed = accountFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const input = parsed.data;
  const sessionContext = await resolveControlledSessionContext({
    source: "accounts.create",
    allowFallback: false,
  });

  if (!sessionContext) {
    return { success: false, error: "authentication required" };
  }

  const auth = requireAuth(sessionContext.auth);
  const organizationId = sessionContext.ownership.organizationId;

  if (!organizationId) {
    return { success: false, error: "organization not found" };
  }

  const pool = appPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const programRes = await client.query(
      `SELECT id, name FROM loyalty_programs WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [input.programId, organizationId],
    );

    if (!programRes.rows.length) {
      await client.query("ROLLBACK");
      return { success: false, error: "program not found" };
    }

    const programName = getProgramDisplayName(programRes.rows[0].name);
    const nickname = normalizeNickname(input.nickname);
    const displayName = buildAccountDisplayName(programName, nickname);
    const initialBalance = input.addInitialBalance ? input.initialBalance : 0;
    const initialCpm = input.addInitialBalance ? input.initialCpm : 0;
    const costBasisCents = calculateInitialCostBasisCents(
      initialBalance,
      initialCpm,
    );

    const insertAccount = await client.query(
      `INSERT INTO program_accounts (
        organization_id,
        program_id,
        nickname,
        holder_name,
        current_points_balance,
        current_cost_basis_cents,
        current_avg_cost_per_thousand_cents,
        status,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING id`,
      [
        organizationId,
        input.programId,
        nickname,
        displayName,
        initialBalance,
        costBasisCents,
        initialCpm,
        "active",
      ],
    );

    const accountId = Number(insertAccount.rows[0].id);

    if (input.addInitialBalance && initialBalance > 0) {
      await writeInitialBalanceEntry({
        client,
        organizationId,
        programId: input.programId,
        accountId,
        balance: initialBalance,
        cpmCents: initialCpm,
      });
    }

    await client.query("COMMIT");

    revalidatePath("/app/accounts");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/purchases");
    revalidatePath("/app/sales");
    revalidatePath("/app/transfers");

    return {
      success: true,
      accountId,
      displayName,
      nickname,
      programName,
      initialBalance,
      initialCpm,
      createdBy: auth.userId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAccountAction(formData: FormData) {
  const parsed = accountFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const input = parsed.data;
  if (!input.accountId) {
    return { success: false, error: "account id is required" };
  }

  const sessionContext = await resolveControlledSessionContext({
    source: "accounts.update",
    accountId: input.accountId,
    allowFallback: false,
  });

  if (!sessionContext) {
    return { success: false, error: "authentication required" };
  }

  const organizationId = sessionContext.ownership.organizationId;
  if (!organizationId) {
    return { success: false, error: "organization not found" };
  }

  const auth = requireAuth(sessionContext.auth);
  await resolveOwnedAccount(auth, input.accountId);

  const pool = appPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const accountRes = await client.query(
      `SELECT pa.id, pa.program_id, lp.name as program_name FROM program_accounts pa LEFT JOIN loyalty_programs lp ON pa.program_id = lp.id WHERE pa.id = $1 AND pa.organization_id = $2 LIMIT 1 FOR UPDATE`,
      [input.accountId, organizationId],
    );

    if (!accountRes.rows.length) {
      await client.query("ROLLBACK");
      return { success: false, error: "account not found" };
    }

    const existing = accountRes.rows[0];
    const programName = getProgramDisplayName(existing.program_name);
    const nickname = normalizeNickname(input.nickname);
    const displayName = buildAccountDisplayName(programName, nickname);
    const balance = input.initialBalance ?? 0;
    const cpm = input.initialCpm ?? 0;
    const isActive = input.isActive ? "active" : "inactive";
    const costBasisCents = calculateInitialCostBasisCents(balance, cpm);

    await client.query(
      `UPDATE program_accounts
       SET nickname = $1,
           holder_name = $2,
           current_points_balance = $3,
           current_cost_basis_cents = $4,
           current_avg_cost_per_thousand_cents = $5,
           status = $6,
           updated_at = NOW()
       WHERE id = $7 AND organization_id = $8`,
      [
        nickname,
        displayName,
        balance,
        costBasisCents,
        cpm,
        isActive,
        input.accountId,
        organizationId,
      ],
    );

    await client.query("COMMIT");

    revalidatePath("/app/accounts");
    revalidatePath("/app/dashboard");

    return {
      success: true,
      accountId: input.accountId,
      displayName,
      nickname,
      currentBalance: balance,
      currentCpm: cpm,
      isActive: isActive === "active",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function inactivateAccountAction(formData: FormData) {
  const accountId = Number(formData.get("accountId"));
  if (!Number.isFinite(accountId) || accountId <= 0) {
    return { success: false, error: "account id is required" };
  }

  const sessionContext = await resolveControlledSessionContext({
    source: "accounts.inactivate",
    accountId,
    allowFallback: false,
  });

  if (!sessionContext) {
    return { success: false, error: "authentication required" };
  }

  const organizationId = sessionContext.ownership.organizationId;
  if (!organizationId) {
    return { success: false, error: "organization not found" };
  }

  const auth = requireAuth(sessionContext.auth);
  await resolveOwnedAccount(auth, accountId);

  const pool = appPool();
  const client = await pool.connect();

  try {
    await client.query(
      `UPDATE program_accounts SET status = 'inactive', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [accountId, organizationId],
    );

    revalidatePath("/app/accounts");
    revalidatePath("/app/dashboard");

    return { success: true, accountId };
  } finally {
    client.release();
  }
}

export async function softDeleteAccountAction(formData: FormData) {
  return inactivateAccountAction(formData);
}
