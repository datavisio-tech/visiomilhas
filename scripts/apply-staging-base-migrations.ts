import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import fs from "fs";
import path from "path";
import { Client } from "pg";

dotenvExpand(dotenv.config());

const ENV = "STAGING_DATABASE_URL";

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

  // Explicit list of base migrations to apply
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

    // If STAGING_DATABASE_NAME is set, require exact match. Otherwise require 'staging' in name.
    const expected = process.env.STAGING_DATABASE_NAME;
    if (expected) {
      if (currentDb !== expected) {
        console.error(
          `current_database()=${currentDb} does not match expected STAGING_DATABASE_NAME=${expected}. Aborting.`,
        );
        process.exit(4);
      }
    } else {
      if (!/staging/i.test(currentDb)) {
        console.error(
          `current_database()=${currentDb} does not look like a staging DB (no 'staging' substring). Aborting.`,
        );
        process.exit(4);
      }
    }

    console.log(`Applying base migrations to staging (db=${currentDb}).`);

    for (const file of migrations) {
      if (!fs.existsSync(file)) {
        console.error(`Migration file not found: ${file}`);
        process.exit(5);
      }
      const sql = fs.readFileSync(file, "utf8");

      const upper = sql.toUpperCase();
      if (
        upper.includes("DROP DATABASE") ||
        upper.includes("DROP SCHEMA") ||
        upper.includes("TRUNCATE ")
      ) {
        console.error(`Destructive command detected in ${file}. Aborting.`);
        process.exit(6);
      }
      if (upper.match(/DELETE\s+FROM\s+/)) {
        console.error(`DELETE statements detected in ${file}. Aborting.`);
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
      "Base migrations applied (note: this script was created for review; do not run without authorization). Masked connection:",
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
