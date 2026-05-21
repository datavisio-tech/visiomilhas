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

  const migrations = [
    path.join("db", "app", "migrations", "0000_misty_kulan_gath.sql"),
  ];

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

    console.log(`Applying base migrations to test DB (db=${currentDb}).`);

    for (const file of migrations) {
      if (!fs.existsSync(file)) {
        console.error(`Migration file not found: ${file}`);
        process.exit(5);
      }

      // Idempotency check: if program_accounts already exists, skip
      const existsRes = await client.query(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='program_accounts') as exists",
      );
      if (existsRes.rows[0]?.exists) {
        console.log(
          "Base schema already present in test DB; skipping base migration.",
        );
        continue;
      }

      const sql = fs.readFileSync(file, "utf8");
      const upper = sql.toUpperCase();
      if (
        upper.includes("DROP DATABASE") ||
        upper.includes("DROP SCHEMA") ||
        upper.includes("TRUNCATE ") ||
        upper.match(/DELETE\s+FROM\s+/)
      ) {
        console.error(`Destructive command detected in ${file}. Aborting.`);
        process.exit(6);
      }

      console.log(`Applying: ${file}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Applied: ${file}`);
      } catch (err: any) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
        console.error(`Error applying ${file}:`, err.message || err);
        process.exit(7);
      }
    }

    console.log(
      "Base migrations applied to test DB. Masked connection:",
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
