import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Pool } from "pg";
import { assertAdminEnv } from "../../lib/env";

// Load and expand .env safely (no printing)
const env = dotenv.config();
dotenvExpand(env);

// Validate admin env presence without logging values
try {
  assertAdminEnv();
} catch (err) {
  console.error(
    "Missing required admin environment variables: POSTGRES_ADMIN_DATABASE_URL",
  );
  process.exit(2);
}

const ADMIN_URL = process.env.POSTGRES_ADMIN_DATABASE_URL as string;

const allowedDatabases = [
  "controle_adm_saas_datavisio",
  "visiomilhas_app",
] as const;

async function main() {
  const pool = new Pool({ connectionString: ADMIN_URL });
  try {
    for (const dbName of allowedDatabases) {
      // check existence
      const check = await pool.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );
      if (check.rows.length) {
        console.log(`Database exists: ${dbName}`);
      } else {
        console.log(`Creating database: ${dbName}`);
        // Strict allowlist ensures safe identifier
        await pool.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Created database: ${dbName}`);
      }
    }
  } catch (e: any) {
    const msg = String(e.message || e);
    if (/permission denied|must be superuser|CREATE DATABASE/.test(msg)) {
      console.error(
        "Permission error: the administrative user needs CREATE DATABASE privilege.",
      );
    } else if (
      /connect|ECONNREFUSED|no such host|database .* does not exist/.test(msg)
    ) {
      console.error(
        "Connection error: cannot reach PostgreSQL administrative endpoint.",
      );
    } else {
      console.error("Error while creating databases: ", msg);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Failed to create databases.");
    process.exit(1);
  });
}

export default main;
