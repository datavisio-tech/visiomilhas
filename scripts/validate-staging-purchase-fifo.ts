import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Client } from "pg";

// Load and expand environment variables so interpolated URLs are resolved
dotenvExpand(dotenv.config());

const EXPECTED_DATABASE = "staging_db";

type ParsedArgs = {
  accountId?: number;
  purchaseId?: number;
  entryId?: number;
};

function parsePositiveInteger(value: string, flagName: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid ${flagName}. Expected a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${flagName}. Expected a positive integer.`);
  }

  return parsed;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--account-id") {
      parsed.accountId = parsePositiveInteger(
        argv[index + 1] ?? "",
        "--account-id",
      );
      index += 1;
      continue;
    }
    if (current === "--purchase-id") {
      parsed.purchaseId = parsePositiveInteger(
        argv[index + 1] ?? "",
        "--purchase-id",
      );
      index += 1;
      continue;
    }
    if (current === "--entry-id") {
      parsed.entryId = parsePositiveInteger(
        argv[index + 1] ?? "",
        "--entry-id",
      );
      index += 1;
      continue;
    }

    if (current.startsWith("--account-id=")) {
      parsed.accountId = parsePositiveInteger(
        current.split("=", 2)[1] ?? "",
        "--account-id",
      );
      continue;
    }
    if (current.startsWith("--purchase-id=")) {
      parsed.purchaseId = parsePositiveInteger(
        current.split("=", 2)[1] ?? "",
        "--purchase-id",
      );
      continue;
    }
    if (current.startsWith("--entry-id=")) {
      parsed.entryId = parsePositiveInteger(
        current.split("=", 2)[1] ?? "",
        "--entry-id",
      );
      continue;
    }
  }

  return parsed;
}

function printRow(label: string, row: unknown) {
  if (row) {
    console.log(label + ":", row);
    return;
  }
  console.log(label + ": none");
}

async function run() {
  const conn = process.env.STAGING_DATABASE_URL;
  if (!conn) {
    console.error(
      "STAGING_DATABASE_URL is not set in the environment. Aborting.",
    );
    process.exit(2);
  }

  const args = parseArgs(process.argv.slice(2));
  const client = new Client({ connectionString: conn });

  await client.connect();
  try {
    const contextRes = await client.query(
      "SELECT current_database() AS db, current_user AS user",
    );
    const context = contextRes.rows[0];

    console.log("current_database():", context.db);
    console.log("current_user():", context.user);

    if (context.db !== EXPECTED_DATABASE) {
      throw new Error(
        `Expected current_database() to be ${EXPECTED_DATABASE}, got ${context.db}.`,
      );
    }

    const [entriesCountRes, lotsCountRes, accountsCountRes] = await Promise.all(
      [
        client.query("SELECT count(*)::int AS cnt FROM mile_entries"),
        client.query("SELECT count(*)::int AS cnt FROM mile_point_lots"),
        client.query("SELECT count(*)::int AS cnt FROM program_accounts"),
      ],
    );

    console.log("mile_entries_count:", entriesCountRes.rows[0].cnt);
    console.log("mile_point_lots_count:", lotsCountRes.rows[0].cnt);
    console.log("program_accounts_count:", accountsCountRes.rows[0].cnt);

    if (args.accountId) {
      const accountRes = await client.query(
        `SELECT id, organization_id, program_id, current_points_balance, current_avg_cost_per_thousand_cents, current_cost_basis_cents, updated_at
         FROM program_accounts
         WHERE id = $1
         LIMIT 1`,
        [args.accountId],
      );
      printRow("program_account", accountRes.rows[0] ?? null);

      const latestPurchaseRes = await client.query(
        `SELECT id, organization_id, program_id, account_id, points, total_cost_cents, cost_per_thousand_cents, purchased_at, status, description
         FROM mile_purchases
         WHERE account_id = $1
         ORDER BY purchased_at DESC NULLS LAST, id DESC
         LIMIT 1`,
        [args.accountId],
      );
      printRow(
        "latest_purchase_for_account",
        latestPurchaseRes.rows[0] ?? null,
      );

      const latestEntryRes = await client.query(
        `SELECT id, organization_id, program_id, account_id, type, direction, points, amount_cents, cost_basis_cents, occurred_at, status, description, source
         FROM mile_entries
         WHERE account_id = $1
         ORDER BY occurred_at DESC, id DESC
         LIMIT 1`,
        [args.accountId],
      );
      printRow("latest_entry_for_account", latestEntryRes.rows[0] ?? null);

      if (args.entryId) {
        const lotsByEntryRes = await client.query(
          `SELECT id, organization_id, program_id, account_id, source_entry_id, acquired_points, remaining_points, total_cost_cents, cost_per_thousand_cents, issued_at, expires_at, status
           FROM mile_point_lots
           WHERE source_entry_id = $1
           ORDER BY id DESC`,
          [args.entryId],
        );
        console.log("lots_linked_to_entry:", lotsByEntryRes.rows);
      }
    }

    if (args.purchaseId) {
      const purchaseRes = await client.query(
        `SELECT id, organization_id, program_id, account_id, points, total_cost_cents, cost_per_thousand_cents, purchased_at, status, description, created_at, updated_at
         FROM mile_purchases
         WHERE id = $1
         LIMIT 1`,
        [args.purchaseId],
      );
      printRow("purchase", purchaseRes.rows[0] ?? null);
    }

    if (args.entryId) {
      const entryRes = await client.query(
        `SELECT id, organization_id, program_id, account_id, type, direction, points, amount_cents, cost_basis_cents, occurred_at, status, description, source, consumed_lot_id, consumed_points
         FROM mile_entries
         WHERE id = $1
         LIMIT 1`,
        [args.entryId],
      );
      printRow("entry", entryRes.rows[0] ?? null);

      const lotsRes = await client.query(
        `SELECT id, organization_id, program_id, account_id, source_entry_id, acquired_points, remaining_points, total_cost_cents, cost_per_thousand_cents, issued_at, expires_at, status
         FROM mile_point_lots
         WHERE source_entry_id = $1
         ORDER BY id DESC`,
        [args.entryId],
      );
      printRow("lots_linked_to_entry", lotsRes.rows);
    }

    if (!args.accountId && !args.purchaseId && !args.entryId) {
      const sampleEntry = await client.query(
        `SELECT id, organization_id, program_id, account_id, type, direction, points, amount_cents, cost_basis_cents, occurred_at, status
         FROM mile_entries
         ORDER BY occurred_at DESC, id DESC
         LIMIT 1`,
      );
      const sampleLot = await client.query(
        `SELECT id, organization_id, program_id, account_id, source_entry_id, acquired_points, remaining_points, total_cost_cents, cost_per_thousand_cents, issued_at, expires_at, status
         FROM mile_point_lots
         ORDER BY issued_at DESC, id DESC
         LIMIT 1`,
      );

      printRow("sample_mile_entry", sampleEntry.rows[0] ?? null);
      printRow("sample_mile_point_lot", sampleLot.rows[0] ?? null);
    }
  } catch (err: any) {
    console.error("Error (sanitized):", err.message || err);
    process.exit(3);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Error (sanitized):", err.message || err);
  process.exit(3);
});
