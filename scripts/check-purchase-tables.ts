import { appPool } from "../db/app/client";

import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

// load .env so scripts can find APP_DATABASE_URL when run via npm
const env = dotenv.config();
dotenvExpand(env as any);

console.log("APP_DATABASE_URL=", process.env.APP_DATABASE_URL);

async function run() {
  const pool = appPool();
  const client = await pool.connect();
  try {
    const tables = [
      "purchase_records",
      "purchase_status_history",
      "purchase_evidences",
      "partner_stores",
      "partner_campaigns",
    ];
    // Print DB connection info
    try {
      const info = await client.query(
        `SELECT current_database() as db, current_user as user`,
      );
      console.log("connected as", info.rows[0]);
    } catch (e) {
      console.log("error getting current_database/user", String(e));
    }
    for (const t of tables) {
      const res = await client.query(`SELECT to_regclass($1) as exists`, [t]);
      console.log(t + ":", res.rows[0].exists ? "OK" : "MISSING");
    }

    // Check specific column
    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_records' AND column_name = 'organization_id' LIMIT 1`,
    );
    console.log(
      "purchase_records.organization_id column:",
      colRes.rows.length ? "OK" : "MISSING",
    );

    // Check drizzle migrations applied
    try {
      const mig = await client.query(
        `SELECT name, applied_at FROM drizzle_migrations ORDER BY applied_at DESC LIMIT 10`,
      );
      console.log("drizzle_migrations (recent):");
      console.log(mig.rows);
    } catch (err) {
      console.log("drizzle_migrations: not found or error");
    }

    // List any tables matching purchase% or partner% to help diagnose
    try {
      const t = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'purchase%' OR table_name LIKE 'partner%') ORDER BY table_name`,
      );
      console.log(
        "tables like purchase% or partner% ->",
        t.rows.map((r: any) => r.table_name),
      );
    } catch (err) {
      console.log("error listing purchase/partner tables", String(err));
    }
  } finally {
    client.release();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
