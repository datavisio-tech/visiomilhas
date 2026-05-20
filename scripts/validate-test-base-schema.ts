import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Client } from "pg";

dotenvExpand(dotenv.config());

const ENV = "TEST_DATABASE_URL";

async function run() {
  const conn = process.env[ENV];
  if (!conn) {
    console.error(`${ENV} not defined. Aborting.`);
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const res = await client.query("SELECT current_database() as db");
    const currentDb = res.rows[0]?.db;
    if (!currentDb) {
      console.error("Unable to determine current_database(); aborting.");
      process.exit(3);
    }
    if (!/test/i.test(currentDb) && !process.env.TEST_DATABASE_NAME) {
      console.error(`current_database()=${currentDb} does not look like test DB. Aborting.`);
      process.exit(4);
    }

    const tables = ["program_accounts", "mile_entries", "mile_transfers"];
    const results: Record<string, boolean> = {};
    for (const t of tables) {
      const r = await client.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) as exists`,
        [t],
      );
      results[t] = r.rows[0]?.exists === true;
    }

    console.log(`current_database(): ${currentDb}`);
    for (const t of tables) {
      console.log(`${t}: ${results[t] ? "FOUND" : "MISSING"}`);
    }

    const colsChecks = {
      mile_entries: ["id", "account_id", "points", "occurred_at"],
      program_accounts: ["id", "organization_id", "current_points_balance"],
    } as Record<string, string[]>;
    for (const [tbl, cols] of Object.entries(colsChecks)) {
      if (!results[tbl]) continue;
      const colRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
        [tbl],
      );
      const existing = new Set(colRes.rows.map((r: any) => r.column_name));
      const missing = cols.filter((c) => !existing.has(c));
      console.log(`${tbl} missing columns: ${missing.length ? missing.join(", ") : "none"}`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(10);
});
