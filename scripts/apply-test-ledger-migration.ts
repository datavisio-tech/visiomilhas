import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import fs from "fs";
import path from "path";
import { Client } from "pg";

dotenvExpand(dotenv.config());

const ENV = "TEST_DATABASE_URL";

function mask(s: string) {
  try {
    return s.replace(/:\/\/.*@/, "://***@").replace(/:\d+\//, ":***\/");
  } catch {
    return "***";
  }
}

async function run() {
  const conn = process.env[ENV];
  if (!conn) {
    console.error(`${ENV} not defined. Aborting.`);
    process.exit(2);
  }

  const migration = path.join(
    "db",
    "app",
    "migrations",
    "0001_add_mile_point_lots.sql",
  );

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
      console.error(
        `current_database()=${currentDb} does not look like test DB. Aborting.`,
      );
      process.exit(4);
    }

    if (!fs.existsSync(migration)) {
      console.error(`Migration file not found: ${migration}`);
      process.exit(5);
    }

    // Idempotency: if mile_point_lots exists, skip
    const existsRes = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mile_point_lots') as exists",
    );
    if (existsRes.rows[0]?.exists) {
      console.log(
        "Ledger migration appears already applied in test DB; skipping.",
      );
      return;
    }

    const sql = fs.readFileSync(migration, "utf8");
    const upper = sql.toUpperCase();
    if (
      upper.includes("DROP DATABASE") ||
      upper.includes("DROP SCHEMA") ||
      upper.includes("TRUNCATE ") ||
      upper.match(/DELETE\s+FROM\s+/)
    ) {
      console.error(`Destructive command detected in ${migration}. Aborting.`);
      process.exit(6);
    }

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`Applied: ${migration}`);
    } catch (err: any) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
      console.error(`Error applying ${migration}:`, err.message || err);
      process.exit(7);
    }

    console.log(
      "Ledger migration applied to test DB. Masked connection:",
      mask(conn),
    );
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(10);
});
