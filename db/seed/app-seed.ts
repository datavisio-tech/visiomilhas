import { appPool } from "../../db/app/client";
import { DEMO_APP } from "./demo-data";

export async function seedApp(organizationId: number): Promise<void> {
  const pool = appPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // programs
    for (const prog of DEMO_APP.programs) {
      const pRes = await client.query(
        `SELECT id FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
        [prog.slug, organizationId],
      );
      if (!pRes.rows.length) {
        await client.query(
          `INSERT INTO loyalty_programs (organization_id, name, slug, type, created_at, updated_at, is_active) VALUES ($1, $2, $3, $4, NOW(), NOW(), true)`,
          [organizationId, prog.name, prog.slug, prog.type],
        );
      }
    }

    // accounts
    for (const acc of DEMO_APP.accounts) {
      const aRes = await client.query(
        `SELECT id FROM program_accounts WHERE nickname = $1 AND organization_id = $2 LIMIT 1`,
        [acc.nickname, organizationId],
      );
      if (!aRes.rows.length) {
        // associate with first program found for simplicity
        const progRow = await client.query(
          `SELECT id FROM loyalty_programs WHERE organization_id = $1 LIMIT 1`,
          [organizationId],
        );
        const programId = progRow.rows.length ? progRow.rows[0].id : null;
        await client.query(
          `INSERT INTO program_accounts (organization_id, program_id, nickname, holder_name, current_points_balance, current_cost_basis_cents, current_avg_cost_per_thousand_cents, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            organizationId,
            programId,
            acc.nickname,
            acc.holderName,
            0,
            0,
            0,
            "active",
          ],
        );
      }
    }

    // Simple coherent entries/purchases/sales/transfers/clubs could be added here.
    // For brevity, we create one purchase and one sale linked to the first account.
    const acctRow = await client.query(
      `SELECT id FROM program_accounts WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );
    if (acctRow.rows.length) {
      const accountId = acctRow.rows[0].id;

      // purchase (idempotent by checking a description marker)
      const purchaseCheck = await client.query(
        `SELECT id FROM mile_purchases WHERE organization_id = $1 AND account_id = $2 AND description = $3 LIMIT 1`,
        [organizationId, accountId, "Seed: compra recebida demo"],
      );
      if (!purchaseCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_purchases (organization_id, program_id, account_id, points, amount_cents, total_cost_cents, cost_per_thousand_cents, purchased_at, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW(), NOW())`,
          [
            organizationId,
            null,
            accountId,
            50000,
            124000,
            124000,
            2480,
            "received",
            "Seed: compra recebida demo",
          ],
        );
      }

      // sale (idempotent)
      const saleCheck = await client.query(
        `SELECT id FROM mile_sales WHERE organization_id = $1 AND account_id = $2 AND description = $3 LIMIT 1`,
        [organizationId, accountId, "Seed: venda concluída demo"],
      );
      if (!saleCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_sales (organization_id, program_id, account_id, customer_name, points, revenue_cents, cost_basis_cents, profit_cents, margin_percentage, sold_at, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())`,
          [
            organizationId,
            null,
            accountId,
            "Cliente Demo",
            30000,
            140820,
            74400,
            66420,
            47,
            "completed",
            "completed",
            "Seed: venda concluída demo",
          ],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default seedApp;
