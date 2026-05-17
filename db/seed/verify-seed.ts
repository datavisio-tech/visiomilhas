import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { admPool, closeAdmPool } from "../../db/adm/client";
import { appPool, closeAppPool } from "../../db/app/client";

// Load and expand .env safely (no printing)
const env = dotenv.config();
dotenvExpand(env);

async function getCount(pool: any, table: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`);
    return res.rows[0]?.cnt ?? 0;
  } catch (err) {
    return null;
  } finally {
    client.release();
  }
}

async function main() {
  const adm = admPool();
  const app = appPool();

  const admTables = [
    "plans",
    "organizations",
    "global_users",
    "organization_memberships",
    "subscriptions",
  ];

  const appTables = [
    "loyalty_programs",
    "program_accounts",
    "mile_entries",
    "mile_purchases",
    "mile_sales",
    "mile_transfers",
    "mile_clubs",
    "beneficiaries",
    "business_contacts",
  ];

  try {
    console.log("Seed verification counts (sanitized):");

    for (const t of admTables) {
      const c = await getCount(adm, t);
      console.log(`${t}: ${c === null ? "ERROR" : c}`);
    }

    for (const t of appTables) {
      const c = await getCount(app, t);
      console.log(`${t}: ${c === null ? "ERROR" : c}`);
    }

    await closeAdmPool();
    await closeAppPool();
    process.exit(0);
  } catch (err) {
    try {
      await closeAdmPool();
      await closeAppPool();
    } catch (e) {}
    console.error("verify-seed failed");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default main;
