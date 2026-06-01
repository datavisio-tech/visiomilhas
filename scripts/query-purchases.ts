import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { appPool } from "../db/app/client";

// load .env and expand variables
dotenvExpand(dotenv.config());

async function main() {
  const pool = appPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, organization_id, account_id, title, order_number, purchase_amount_cents, multiplier, status, created_at
       FROM purchase_records
       WHERE account_id = $1 AND title ILIKE $2
       ORDER BY id DESC
       LIMIT 10`,
      [38, "%Notebook Dell%"],
    );
    const rows = res.rows;
    for (const r of rows) {
      const hist = await client.query(
        `SELECT id, old_status, new_status, notes, created_at FROM purchase_status_history WHERE purchase_id = $1 ORDER BY created_at ASC`,
        [r.id],
      );
      const ev = await client.query(
        `SELECT id, file_name, file_type, file_url, uploaded_at FROM purchase_evidences WHERE purchase_id = $1 ORDER BY id ASC`,
        [r.id],
      );
      r.status_history = hist.rows;
      r.evidences = ev.rows;
    }
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    client.release();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
