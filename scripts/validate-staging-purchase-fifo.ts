import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const conn = process.env.STAGING_DATABASE_URL;
if (!conn) {
  console.error(
    "STAGING_DATABASE_URL is not set in the environment. Aborting.",
  );
  process.exit(2);
}

async function run() {
  const client = new Client({ connectionString: conn });
  await client.connect();
  try {
    // sample read-only checks: counts and one sample id per table
    const res1 = await client.query(
      "SELECT count(*)::int AS cnt FROM mile_entries",
    );
    const res2 = await client.query(
      "SELECT count(*)::int AS cnt FROM mile_point_lots",
    );
    const res3 = await client.query(
      "SELECT count(*)::int AS cnt FROM program_accounts",
    );
    const sampleEntry = await client.query(
      "SELECT id, account_id, points_acquired FROM mile_entries ORDER BY occurred_at DESC LIMIT 1",
    );
    const sampleLot = await client.query(
      "SELECT id, account_id, remaining_points FROM mile_point_lots ORDER BY created_at DESC LIMIT 1",
    );

    console.log("mile_entries_count:", res1.rows[0].cnt);
    console.log("mile_point_lots_count:", res2.rows[0].cnt);
    console.log("program_accounts_count:", res3.rows[0].cnt);

    if (sampleEntry.rows.length) {
      const r = sampleEntry.rows[0];
      console.log("sample_mile_entry:", {
        id: r.id,
        account_id: r.account_id,
        points_acquired: r.points_acquired,
      });
    } else {
      console.log("sample_mile_entry: none");
    }

    if (sampleLot.rows.length) {
      const r = sampleLot.rows[0];
      console.log("sample_mile_point_lot:", {
        id: r.id,
        account_id: r.account_id,
        remaining_points: r.remaining_points,
      });
    } else {
      console.log("sample_mile_point_lot: none");
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Error (sanitized):", err.message || err);
  process.exit(3);
});
