"use server";
import { createSaleSchema } from "../../../lib/validations/sales";
import { appPool } from "../../../db/app/client";
import { calculateSaleImpact } from "../../../lib/domain/miles-calculations";
import { revalidatePath } from "next/cache";
import { isFifoMovementsEngineEnabled } from "../../../lib/featureFlags";
import { consumeMilesUseCase } from "../../../lib/services/movements.use-cases";
import { createDrizzleMovementsRepoFromClient } from "../../../lib/repositories/movements.drizzle-repo";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import {
  AuthContextError,
  requireAuth,
} from "../../../lib/server/auth-context";
import { reportAuthEvent } from "../../../lib/server/auth-observability";
import {
  ensureNoDuplicateSale,
  validateFinancialIntegrity,
} from "../../../lib/server/financial-integrity";
import { resolveOwnedAccount } from "../../../lib/server/ownership-resolvers";
import { type SessionContextResolver } from "../../../lib/server/controlled-session";

type Deps = {
  appPool?: any;
  resolveSessionContext?: SessionContextResolver;
  resolveOwnedAccount?: typeof resolveOwnedAccount;
  revalidatePath?: typeof revalidatePath;
  isFifoMovementsEngineEnabled?: typeof isFifoMovementsEngineEnabled;
  consumeMilesUseCase?: typeof consumeMilesUseCase;
};

export async function createSaleAction(formData: FormData, deps: Deps = {}) {
  const parsed = createSaleSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success)
    return { success: false, errors: parsed.error.flatten() };
  const input = parsed.data;
  const sessionContext = await (
    deps.resolveSessionContext ?? resolveControlledSessionContext
  )({
    accountId: input.accountId,
    source: "sale.action",
  });

  if (!sessionContext) {
    reportAuthEvent({
      level: "warn",
      code: "UNAUTHENTICATED",
      message: "Sale action rejected before ownership check",
      details: { accountId: input.accountId },
    });
    return { success: false, error: "authentication required" };
  }

  try {
    const auth = requireAuth(sessionContext.auth);
    const resolveOwnedAccountFn = deps.resolveOwnedAccount ?? resolveOwnedAccount;
    const ownedAccount = await resolveOwnedAccountFn(auth, input.accountId);
    const orgId = ownedAccount.ownership.organizationId;

    if (orgId === null || orgId === undefined) {
      return { success: false, error: "organization not found" };
    }

    const pool = (deps.appPool ?? appPool)();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accRes = await client.query(
        `SELECT current_points_balance, current_avg_cost_per_thousand_cents FROM program_accounts WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [input.accountId],
      );
      if (!accRes.rows.length) {
        await client.query("ROLLBACK");
        return { success: false, error: "account not found" };
      }
      const acc = accRes.rows[0];

      const impact = calculateSaleImpact({
        currentBalance: Number(acc.current_points_balance || 0),
        currentCpmCents: Number(acc.current_avg_cost_per_thousand_cents || 0),
        pointsSold: Number(input.points),
        saleAmountCents: Number(input.totalAmountCents),
      });

      const now = input.soldAt ? new Date(input.soldAt) : new Date();

      if (
        await ensureNoDuplicateSale(client, {
          organizationId: orgId,
          accountId: input.accountId,
          points: Number(input.points),
          totalAmountCents: Number(input.totalAmountCents),
          soldAt: now,
          description: input.description || null,
          customerName: input.customerName || null,
        })
      ) {
        await client.query("ROLLBACK");
        return { success: false, error: "duplicate operation blocked" };
      }

      const insertSale = await client.query(
        `INSERT INTO mile_sales (organization_id, program_id, account_id, customer_name, points, revenue_cents, profit_cents, sold_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING id`,
        [
          orgId,
          input.programId,
          input.accountId,
          input.customerName || null,
          input.points,
          input.totalAmountCents,
          impact.profitCents,
          now.toISOString(),
          "completed",
          input.description || null,
        ],
      );

      if ((deps.isFifoMovementsEngineEnabled ?? isFifoMovementsEngineEnabled)()) {
        const txRepo = createDrizzleMovementsRepoFromClient(client);

        await (deps.consumeMilesUseCase ?? consumeMilesUseCase)({
          organizationId: orgId,
          accountId: input.accountId,
          amount: Number(input.points),
          description: input.description || undefined,
          occurredAt: now,
        }, txRepo);

        await client.query("COMMIT");
      } else {
        await client.query(
          `INSERT INTO mile_entries (organization_id, program_id, account_id, type, direction, points, amount_cents, cost_basis_cents, occurred_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
          [
            orgId,
            input.programId,
            input.accountId,
            "sale",
            "out",
            input.points,
            input.totalAmountCents,
            impact.costBaseCents,
            now.toISOString(),
            "completed",
            input.description || null,
          ],
        );

        await client.query(
          `UPDATE program_accounts SET current_points_balance = $1, updated_at = NOW() WHERE id = $2`,
          [impact.newBalance, input.accountId],
        );

        await client.query("COMMIT");
      }

      await validateFinancialIntegrity(client, {
        organizationId: orgId,
        accountId: input.accountId,
        source: "sale.action",
        emitEvents: true,
      });

      (deps.revalidatePath ?? revalidatePath)("/app/dashboard");
      (deps.revalidatePath ?? revalidatePath)("/app/accounts");
      (deps.revalidatePath ?? revalidatePath)("/app/entries");
      (deps.revalidatePath ?? revalidatePath)("/app/sales");

      return {
        success: true,
        saleId: insertSale.rows[0].id,
        previousBalance: Number(acc.current_points_balance || 0),
        newBalance: impact.newBalance,
        pointsSold: Number(input.points),
        totalAmountCents: Number(input.totalAmountCents),
        costBaseCents: impact.costBaseCents,
        profitCents: impact.profitCents,
        currentCpmCents: Number(acc.current_avg_cost_per_thousand_cents || 0),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof AuthContextError) {
      reportAuthEvent({
        level: "warn",
        code: error.code === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHENTICATED",
        message: `Sale action blocked: ${error.message}`,
        details: {
          accountId: input.accountId,
          status: error.status,
        },
      });
      return { success: false, error: error.message };
    }

    throw error;
  }
}

export default createSaleAction;
