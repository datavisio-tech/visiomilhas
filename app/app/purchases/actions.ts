"use server";
import { createPurchaseSchema } from "../../../lib/validations/purchases";
import { appPool } from "../../../db/app/client";
import { admPool } from "../../../db/adm/client";
import { calculatePurchaseImpact } from "../../../lib/domain/miles-calculations";
import { revalidatePath } from "next/cache";
import { isFifoMovementsEngineEnabled } from "../../../lib/featureFlags";
import { acquireMilesUseCase } from "../../../lib/services/movements.use-cases";

export async function createPurchaseAction(formData: FormData) {
  const parsed = createPurchaseSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success)
    return { success: false, errors: parsed.error.flatten() };
  const input = parsed.data;

  const admClient = await admPool().connect();
  try {
    const orgRes = await admClient.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [input.orgSlug ?? "demo-visiomilhas"],
    );
    if (!orgRes.rows.length)
      return { success: false, error: "organization not found" };
    const orgId = orgRes.rows[0].id;

    const pool = appPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accRes = await client.query(
        `SELECT current_points_balance, current_avg_cost_per_thousand_cents, current_cost_basis_cents FROM program_accounts WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [input.accountId],
      );
      if (!accRes.rows.length) {
        await client.query("ROLLBACK");
        return { success: false, error: "account not found" };
      }
      const acc = accRes.rows[0];
      const impact = calculatePurchaseImpact({
        currentBalance: Number(acc.current_points_balance || 0),
        currentCpmCents: Number(acc.current_avg_cost_per_thousand_cents || 0),
        pointsBought: Number(input.points),
        totalCostCents: Number(input.totalCostCents),
      });

      const now = input.purchasedAt ? new Date(input.purchasedAt) : new Date();

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
      // If FIFO movements engine is enabled, delegate entry/lot creation and
      // balance update to the movements use-case. We still insert the purchase
      // record and update cost-related columns here to preserve pricing data.
      if (isFifoMovementsEngineEnabled()) {
        await client.query(
          `UPDATE program_accounts SET current_avg_cost_per_thousand_cents = $1, current_cost_basis_cents = $2, updated_at = NOW() WHERE id = $3`,
          [impact.newCpmCents, impact.newTotalCostCents, input.accountId],
        );
        await client.query("COMMIT");

        // Call movements engine to create entry/lot and update balance (separate transaction)
        await acquireMilesUseCase({
          organizationId: orgId,
          accountId: input.accountId,
          amount: Number(input.points),
          source: "purchase",
          description: input.description || undefined,
          occurredAt: now,
        });
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
        await client.query("COMMIT");
      }

      await client.query("COMMIT");

      // revalidate relevant paths
      revalidatePath("/app/dashboard");
      revalidatePath("/app/accounts");
      revalidatePath("/app/entries");
      revalidatePath("/app/purchases");

      return {
        success: true,
        purchaseId: insertPurchase.rows[0].id,
        newBalance: impact.newBalance,
      };
    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } finally {
    admClient.release();
  }
}

export default createPurchaseAction;
