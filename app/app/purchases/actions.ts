import { createPurchaseSchema } from "../../../lib/validations/purchases";
import { appPool } from "../../../db/app/client";
import { calculatePurchaseImpact } from "../../../lib/domain/miles-calculations";
import { revalidatePath } from "next/cache";
import { isFifoMovementsEngineEnabled } from "../../../lib/featureFlags";
import { acquireMilesUseCase } from "../../../lib/services/movements.use-cases";
import { createDrizzleMovementsRepoFromClient } from "../../../lib/repositories/movements.drizzle-repo";
import {
  ensureNoDuplicatePurchase,
  validateFinancialIntegrity,
} from "../../../lib/server/financial-integrity";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import {
  AuthContextError,
  requireAuth,
} from "../../../lib/server/auth-context";
import { reportAuthEvent } from "../../../lib/server/auth-observability";
import { resolveOwnedAccount } from "../../../lib/server/ownership-resolvers";
import { type SessionContextResolver } from "../../../lib/server/controlled-session";

type Deps = {
  appPool?: any;
  isFifoMovementsEngineEnabled?: any;
  acquireMilesUseCase?: any;
  revalidatePath?: any;
  resolveSessionContext?: SessionContextResolver;
  resolveOwnedAccount?: typeof resolveOwnedAccount;
};

export async function createPurchaseAction(
  formData: FormData,
  deps: Deps = {},
) {
  const parsed = createPurchaseSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success)
    return { success: false, errors: parsed.error.flatten() };
  const input = parsed.data;
  const sessionContext = await (
    deps.resolveSessionContext ?? resolveControlledSessionContext
  )({
    accountId: input.accountId,
    source: "purchase.action",
  });

  if (!sessionContext) {
    reportAuthEvent({
      level: "warn",
      code: "UNAUTHENTICATED",
      message: "Purchase action rejected before ownership check",
      details: { accountId: input.accountId },
    });
    return { success: false, error: "authentication required" };
  }

  try {
    const auth = requireAuth(sessionContext.auth);
    const resolveOwnedAccountFn =
      deps.resolveOwnedAccount ?? resolveOwnedAccount;
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
        `SELECT program_id, current_points_balance, current_avg_cost_per_thousand_cents, current_cost_basis_cents FROM program_accounts WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [input.accountId],
      );
      if (!accRes.rows.length) {
        await client.query("ROLLBACK");
        return { success: false, error: "account not found" };
      }
      const acc = accRes.rows[0];
      if (
        input.programId != null &&
        Number(acc.program_id) !== Number(input.programId)
      ) {
        await client.query("ROLLBACK");
        return {
          success: false,
          error: "account does not belong to selected program",
        };
      }
      input.programId = Number(acc.program_id);
      const impact = calculatePurchaseImpact({
        currentBalance: Number(acc.current_points_balance || 0),
        currentCpmCents: Number(acc.current_avg_cost_per_thousand_cents || 0),
        pointsBought: Number(input.points),
        totalCostCents: Number(input.totalCostCents),
      });

      const now = input.purchasedAt ? new Date(input.purchasedAt) : new Date();

      if (
        await ensureNoDuplicatePurchase(client, {
          organizationId: orgId,
          accountId: input.accountId,
          points: Number(input.points),
          totalCostCents: Number(input.totalCostCents),
          purchasedAt: now,
          description: input.description || null,
        })
      ) {
        await client.query("ROLLBACK");
        return { success: false, error: "duplicate operation blocked" };
      }

      const insertPurchase = await client.query(
        `INSERT INTO mile_purchases (organization_id, program_id, account_id, points, total_cost_cents, cost_per_thousand_cents, purchased_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id`,
        [
          orgId,
          input.programId,
          input.accountId,
          input.points,
          input.totalCostCents,
          impact.newCpmCents,
          now.toISOString(),
          "completed",
          input.description || null,
        ],
      );

      if (
        (deps.isFifoMovementsEngineEnabled ?? isFifoMovementsEngineEnabled)()
      ) {
        await client.query(
          `UPDATE program_accounts SET current_avg_cost_per_thousand_cents = $1, current_cost_basis_cents = $2, updated_at = NOW() WHERE id = $3`,
          [impact.newCpmCents, impact.newTotalCostCents, input.accountId],
        );

        const txRepo = createDrizzleMovementsRepoFromClient(client);

        await (deps.acquireMilesUseCase ?? acquireMilesUseCase)(
          {
            organizationId: orgId,
            accountId: input.accountId,
            amount: Number(input.points),
            source: "purchase",
            description: input.description || undefined,
            occurredAt: now,
          },
          txRepo,
        );
      } else {
        await client.query(
          `INSERT INTO mile_entries (organization_id, program_id, account_id, type, direction, points, amount_cents, cost_basis_cents, occurred_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
          [
            orgId,
            input.programId,
            input.accountId,
            "purchase",
            "in",
            input.points,
            input.totalCostCents,
            impact.newTotalCostCents,
            now.toISOString(),
            "completed",
            input.description || null,
          ],
        );

        await client.query(
          `UPDATE program_accounts SET current_points_balance = $1, current_avg_cost_per_thousand_cents = $2, current_cost_basis_cents = $3, updated_at = NOW() WHERE id = $4`,
          [
            impact.newBalance,
            impact.newCpmCents,
            impact.newTotalCostCents,
            input.accountId,
          ],
        );
      }

      await client.query("COMMIT");

      await validateFinancialIntegrity(client, {
        organizationId: orgId,
        accountId: input.accountId,
        source: "purchase.action",
        emitEvents: true,
      });

      (deps.revalidatePath ?? revalidatePath)("/app/dashboard");
      (deps.revalidatePath ?? revalidatePath)("/app/accounts");
      (deps.revalidatePath ?? revalidatePath)("/app/entries");
      (deps.revalidatePath ?? revalidatePath)("/app/purchases");

      return {
        success: true,
        purchaseId: insertPurchase.rows[0].id,
        previousBalance: Number(acc.current_points_balance || 0),
        newBalance: impact.newBalance,
        pointsBought: Number(input.points),
        totalCostCents: Number(input.totalCostCents),
        previousCpmCents: Number(acc.current_avg_cost_per_thousand_cents || 0),
        newCpmCents: impact.newCpmCents,
        newCostBasisCents: impact.newTotalCostCents,
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
        message: `Purchase action blocked: ${error.message}`,
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

// Server Action wrapper: keep the implementation testable (named export)
// and provide a thin server action default export that Next will proxy.
export default async function createPurchaseActionServer(
  formData: FormData,
  deps: Deps = {},
) {
  "use server";
  return createPurchaseAction(formData, deps);
}
