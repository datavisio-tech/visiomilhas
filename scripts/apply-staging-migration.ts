import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import fs from "fs";
import { Client } from "pg";

// Safe runner for applying a single SQL migration file to STAGING_DATABASE_URL
// Usage: tsx scripts/apply-staging-migration.ts path/to/migration.sql

dotenvExpand(dotenv.config());

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error(
      "Usage: tsx scripts/apply-staging-migration.ts <migration.sql>",
    );
    process.exit(2);
  }

  const envVar = "STAGING_DATABASE_URL";
  const connStr = process.env[envVar];
  if (!connStr) {
    console.error(`Missing ${envVar} in environment. Aborting.`);
    process.exit(3);
  }

  const sql = fs.readFileSync(file, "utf8");

  // Basic safety checks
  const upper = sql.toUpperCase();
  if (
    upper.includes("DROP DATABASE") ||
    upper.includes("DROP SCHEMA") ||
    upper.includes("TRUNCATE ")
  ) {
    console.error(
      "Migration appears to contain destructive commands (DROP/TRUNCATE). Aborting.",
    );
    process.exit(4);
  }
  if (upper.match(/DELETE\s+FROM\s+\w+/)) {
    console.error("Migration contains DELETE statements; aborting as unsafe.");
    process.exit(4);
  }

  console.log("Applying migration (dry-run guard):", file);
  console.log("Target database: STAGING (using STAGING_DATABASE_URL)");

  const client = new Client({ connectionString: connStr });
  try {
    await client.connect();
    // Execute inside a transaction to allow rollback if needed
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration applied successfully (staging).");
  } catch (err: any) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("Migration failed:", err.message || err);
    process.exit(5);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(10);
});
