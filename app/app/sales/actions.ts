"use server";
import { createSaleSchema } from "../../../lib/validations/sales";
import { appPool } from "../../../db/app/client";
import { admPool } from "../../../db/adm/client";
import { calculateSaleImpact } from "../../../lib/domain/miles-calculations";
import { revalidatePath } from "next/cache";

export async function createSaleAction(formData: FormData) {
  const parsed = createSaleSchema.safeParse(
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

      revalidatePath("/app/dashboard");
      revalidatePath("/app/accounts");
      revalidatePath("/app/entries");
      revalidatePath("/app/sales");

      return {
        success: true,
        saleId: insertSale.rows[0].id,
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

export default createSaleAction;
