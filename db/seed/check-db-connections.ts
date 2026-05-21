import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Pool } from "pg";

// Load and expand .env safely
const env = dotenv.config();
dotenvExpand(env);

const targets: Array<{ name: string; varName: string }> = [
  { name: "ADM", varName: "ADM_DATABASE_URL" },
  { name: "APP", varName: "APP_DATABASE_URL" },
];

async function checkOne(varName: string) {
  const url = process.env[varName];
  if (!url) return { ok: false, reason: "MISSING_VAR" };

  const pool = new Pool({ connectionString: url });
  try {
    const res = await pool.query("SELECT current_database() as db");
    const db = res.rows?.[0]?.db;
    return { ok: true, database: String(db) };
  } catch (e: any) {
    const msg = String(e.message || e);
    // sanitize common sensitive patterns (just in case)
    const safe = msg.replace(/\S*postgres:\/\/\S*/g, "[REDACTED]");
    return { ok: false, reason: safe };
  } finally {
    await pool.end();
  }
}

async function main() {
  const results: Record<string, any> = {};
  for (const t of targets) {
    const r = await checkOne(t.varName);
    if (r.ok) {
      console.log(`${t.varName}: OK (database=${r.database})`);
    } else if (r.reason === "MISSING_VAR") {
      console.log(`${t.varName}: MISSING`);
    } else {
      console.log(`${t.varName}: ERROR (${r.reason})`);
    }
    results[t.varName] = r;
  }

  // exit code: 0 if both OK or missing only (we don't create here), 1 if any connection error
  const anyError = Object.values(results).some(
    (v) => v && v.ok === false && v.reason !== "MISSING_VAR",
  );
  process.exit(anyError ? 1 : 0);
}

if (require.main === module) {
  main().catch(() => process.exit(1));
}

export default main;
