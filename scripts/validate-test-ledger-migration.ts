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
      console.error(
        `current_database()=${currentDb} does not look like test DB. Aborting.`,
      );
      process.exit(4);
    }

    const objects = ["mile_point_lots", "mile_transfers"];
    for (const o of objects) {
      const r = await client.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) as exists`,
        [o],
      );
      console.log(`${o}: ${r.rows[0]?.exists ? "FOUND" : "MISSING"}`);
    }

    const idxs = [
      "idx_mpl_account_remaining",
      "idx_mpl_source_entry",
      "idx_me_account_occurred",
      "idx_mt_source_dest",
    ];
    for (const ix of idxs) {
      const q = await client.query(
        `SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname=$1) as exists`,
        [ix],
      );
      console.log(`${ix}: ${q.rows[0]?.exists ? "FOUND" : "MISSING"}`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(10);
});
