import { appPool } from "../../db/app/client";
import { DEMO_APP } from "./demo-data";

const CLUBS = [
  { name: "Clube Livelo", programSlug: "livelo" },
  { name: "Clube Smiles", programSlug: "smiles" },
  { name: "Clube Latam Pass", programSlug: "latam" },
];

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
        // associate with program by slug if provided
        let programId = null;
        if ((acc as any).programSlug) {
          const progRow = await client.query(
            `SELECT id FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
            [(acc as any).programSlug, organizationId],
          );
          programId = progRow.rows.length ? progRow.rows[0].id : null;
        } else {
          const progRow = await client.query(
            `SELECT id FROM loyalty_programs WHERE organization_id = $1 LIMIT 1`,
            [organizationId],
          );
          programId = progRow.rows.length ? progRow.rows[0].id : null;
        }
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

    // clubs
    for (const c of CLUBS) {
      const clubCheck = await client.query(
        `SELECT id FROM mile_clubs WHERE name = $1 AND organization_id = $2 LIMIT 1`,
        [c.name, organizationId],
      );
      if (!clubCheck.rows.length) {
        const progRow = await client.query(
          `SELECT id FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
          [c.programSlug, organizationId],
        );
        const programId = progRow.rows.length ? progRow.rows[0].id : null;
        await client.query(
          `INSERT INTO mile_clubs (organization_id, program_id, name, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [organizationId, programId, c.name, "active"],
        );
      }
    }

    // initial entries / purchases / sales / transfers
    const liveloProg = await client.query(
      `SELECT id FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
      ["livelo", organizationId],
    );
    const liveloProgramId = liveloProg.rows.length
      ? liveloProg.rows[0].id
      : null;
    const liveloAcctRow = await client.query(
      `SELECT id FROM program_accounts WHERE organization_id = $1 AND program_id = $2 LIMIT 1`,
      [organizationId, liveloProgramId],
    );
    if (liveloAcctRow.rows.length) {
      const accountId = liveloAcctRow.rows[0].id;
      const entryCheck = await client.query(
        `SELECT id FROM mile_entries WHERE organization_id = $1 AND account_id = $2 AND description = $3 LIMIT 1`,
        [organizationId, accountId, "Seed: saldo inicial Livelo"],
      );
      if (!entryCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_entries (organization_id, program_id, account_id, type, direction, points, occurred_at, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())`,
          [
            organizationId,
            liveloProgramId,
            accountId,
            "initial_balance",
            "in",
            10000,
            "Seed: saldo inicial Livelo",
            "posted",
          ],
        );
      }
    }

    const latamProg = await client.query(
      `SELECT id FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
      ["latam", organizationId],
    );
    const latamProgramId = latamProg.rows.length ? latamProg.rows[0].id : null;
    const latamAcctRow = await client.query(
      `SELECT id FROM program_accounts WHERE organization_id = $1 AND program_id = $2 LIMIT 1`,
      [organizationId, latamProgramId],
    );
    if (latamAcctRow.rows.length) {
      const accountId = latamAcctRow.rows[0].id;
      const purchaseCheck = await client.query(
        `SELECT id FROM mile_purchases WHERE organization_id = $1 AND account_id = $2 AND description = $3 LIMIT 1`,
        [organizationId, accountId, "Seed: compra Latam 30k"],
      );
      if (!purchaseCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_purchases (organization_id, program_id, account_id, points, amount_cents, total_cost_cents, cost_per_thousand_cents, purchased_at, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW(), NOW())`,
          [
            organizationId,
            latamProgramId,
            accountId,
            30000,
            74400,
            74400,
            2480,
            "received",
            "Seed: compra Latam 30k",
          ],
        );
      }

      const saleCheck = await client.query(
        `SELECT id FROM mile_sales WHERE organization_id = $1 AND account_id = $2 AND description = $3 LIMIT 1`,
        [organizationId, accountId, "Seed: venda Latam 5k"],
      );
      if (!saleCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_sales (organization_id, program_id, account_id, customer_name, points, revenue_cents, cost_basis_cents, profit_cents, margin_percentage, sold_at, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())`,
          [
            organizationId,
            latamProgramId,
            accountId,
            "Cliente Demo",
            5000,
            25000,
            12000,
            13000,
            52,
            "completed",
            "Seed: venda Latam 5k",
          ],
        );
      }
    }

    // Transfer Livelo -> Latam (idempotent)
    if (
      liveloProgramId &&
      latamProgramId &&
      liveloAcctRow.rows.length &&
      latamAcctRow.rows.length
    ) {
      const fromAccountId = liveloAcctRow.rows[0].id;
      const toAccountId = latamAcctRow.rows[0].id;
      const transferCheck = await client.query(
        `SELECT id FROM mile_transfers WHERE organization_id = $1 AND from_account_id = $2 AND to_account_id = $3 AND points_sent = $4 AND description = $5 LIMIT 1`,
        [
          organizationId,
          fromAccountId,
          toAccountId,
          2000,
          "Seed: transfer Livelo->Latam",
        ],
      );
      if (!transferCheck.rows.length) {
        await client.query(
          `INSERT INTO mile_transfers (organization_id, from_program_id, from_account_id, to_program_id, to_account_id, points_sent, points_received, transferred_at, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW(), NOW())`,
          [
            organizationId,
            liveloProgramId,
            fromAccountId,
            latamProgramId,
            toAccountId,
            2000,
            2000,
            "completed",
            "Seed: transfer Livelo->Latam",
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
