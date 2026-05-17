import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Pool } from "pg";

// load .env
const env = dotenv.config();
dotenvExpand(env as any);

async function checkUrl(varName: string, tables: string[]) {
  const url = process.env[varName];
  if (!url) {
    console.log(`${varName}: MISSING`);
    return { varName, missing: true };
  }

  const pool = new Pool({ connectionString: url });
  try {
    const dbRes = await pool.query(`SELECT current_database() as db`);
    const dbName = dbRes.rows[0].db;
    console.log(`${varName}: OK (database=${dbName})`);
    for (const t of tables) {
      const q = `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`;
      const res = await pool.query(q, [t]);
      const exists = Number(res.rows[0].cnt) > 0;
      console.log(`${t}: ${exists ? "OK" : "MISSING"}`);
    }
    return { varName, missing: false, database: dbName };
  } catch (err: any) {
    const msg = String(err.message || err);
    console.log(`${varName}: ERROR (${msg.replace(/\n/g, " ")})`);
    return { varName, error: true };
  } finally {
    await pool.end();
  }
}

async function main() {
  await checkUrl("ADM_DATABASE_URL", [
    "global_users",
    "organizations",
    "organization_memberships",
    "plans",
    "subscriptions",
    "billing_events",
    "admin_audit_logs",
  ]);

  console.log("");

  await checkUrl("APP_DATABASE_URL", [
    "loyalty_programs",
    "program_accounts",
    "mile_entries",
    "mile_purchases",
    "mile_sales",
    "mile_transfers",
    "mile_clubs",
    "beneficiaries",
    "business_contacts",
  ]);

  process.exit(0);
}

main().catch((err) => {
  console.error("ERROR", String(err.message || err));
  process.exit(1);
});
