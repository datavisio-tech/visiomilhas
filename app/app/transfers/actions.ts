"use server";
import { createTransferSchema } from "../../../lib/validations/transfers";
import { appPool } from "../../../db/app/client";
import { admPool } from "../../../db/adm/client";
import { calculateTransferImpact } from "../../../lib/domain/miles-calculations";
import { revalidatePath } from "next/cache";
import { isFifoMovementsEngineEnabled } from "../../../lib/featureFlags";
import { transferMilesUseCase } from "../../../lib/services/movements.use-cases";

export async function createTransferAction(formData: FormData) {
  const parsed = createTransferSchema.safeParse(
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
      const fromRes = await client.query(
        `SELECT current_points_balance, current_avg_cost_per_thousand_cents FROM program_accounts WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [input.fromAccountId],
      );
      const toRes = await client.query(
        `SELECT current_points_balance, current_avg_cost_per_thousand_cents FROM program_accounts WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [input.toAccountId],
      );
      if (!fromRes.rows.length || !toRes.rows.length) {
        await client.query("ROLLBACK");
        return { success: false, error: "account not found" };
      }
      const fromAcc = fromRes.rows[0];
      const toAcc = toRes.rows[0];

      const impact = calculateTransferImpact({
        originBalance: Number(fromAcc.current_points_balance || 0),
        destinationBalance: Number(toAcc.current_points_balance || 0),
        originCpmCents: Number(
          fromAcc.current_avg_cost_per_thousand_cents || 0,
        ),
        destinationCpmCents: Number(
          toAcc.current_avg_cost_per_thousand_cents || 0,
        ),
        pointsSent: Number(input.pointsSent),
        bonusPercent: Number(input.bonusPercent || 0),
        feeCents: Number(input.feeCents || 0),
      });

      const now = input.transferredAt
        ? new Date(input.transferredAt)
        : new Date();

      const insertTransfer = await client.query(
        `INSERT INTO mile_transfers (organization_id, from_account_id, to_account_id, points_sent, points_received, bonus_percentage, transfer_fee_cents, transferred_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING id`,
        [
          orgId,
          input.fromAccountId,
          input.toAccountId,
          input.pointsSent,
          impact.pointsReceived,
          input.bonusPercent || 0,
          input.feeCents || 0,
          now.toISOString(),
          "completed",
          input.description || null,
        ],
      );

      if (isFifoMovementsEngineEnabled()) {
        // commit transfer record and delegate entry/lot updates and balance
        // updates to the movements engine
        await client.query("COMMIT");

        await transferMilesUseCase({
          organizationId: orgId,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: Number(input.pointsSent),
          description: input.description || undefined,
          occurredAt: now,
        });
      } else {
        await client.query(
          `INSERT INTO mile_entries (organization_id, program_id, account_id, type, direction, points, occurred_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
          [
            orgId,
            null,
            input.fromAccountId,
            "transfer",
            "out",
            input.pointsSent,
            now.toISOString(),
            "completed",
            input.description || null,
          ],
        );

        await client.query(
          `INSERT INTO mile_entries (organization_id, program_id, account_id, type, direction, points, occurred_at, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
          [
            orgId,
            null,
            input.toAccountId,
            "transfer",
            "in",
            impact.pointsReceived,
            now.toISOString(),
            "completed",
            input.description || null,
          ],
        );

        await client.query(
          `UPDATE program_accounts SET current_points_balance = $1, current_avg_cost_per_thousand_cents = $2, updated_at = NOW() WHERE id = $3`,
          [
            impact.newOriginBalance,
            fromAcc.current_avg_cost_per_thousand_cents,
            input.fromAccountId,
          ],
        );

        await client.query(
          `UPDATE program_accounts SET current_points_balance = $1, current_avg_cost_per_thousand_cents = $2, updated_at = NOW() WHERE id = $3`,
          [
            impact.newDestinationBalance,
            impact.newDestinationCpmCents,
            input.toAccountId,
          ],
        );

        await client.query("COMMIT");
      }

      revalidatePath("/app/dashboard");
      revalidatePath("/app/accounts");
      revalidatePath("/app/entries");
      revalidatePath("/app/transfers");

      return { success: true, transferId: insertTransfer.rows[0].id };
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

export default createTransferAction;
