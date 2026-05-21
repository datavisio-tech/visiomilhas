import dotenv from "dotenv";
import { Client } from "pg";
import dotenvExpand from "dotenv-expand";

dotenv.config();

function maskHost(host: string) {
  // mask last segment of IPv4 or last label of hostname
  if (!host) return "unknown";
  const parts = host.split(".");
  if (parts.length >= 2) {
    parts[parts.length - 1] = "***";
    return parts.join(".");
  }
  return host;
}

function maskUser(user: string) {
  if (!user) return "unknown";
  if (user.length <= 2) return user[0] + "*";
  return user[0] + "***" + user[user.length - 1];
}

async function main() {
  const target = process.argv[2];
  if (!target || !["staging", "test"].includes(target)) {
    console.error("Usage: tsx scripts/preflight-db.ts <staging|test>");
    process.exit(2);
  }

  const envVar =
    target === "staging" ? "STAGING_DATABASE_URL" : "TEST_DATABASE_URL";
  // ensure .env variables with ${VAR} are expanded before reading
  const env = dotenv.config();
  dotenvExpand(env);
  const connStr = process.env[envVar];
  if (!connStr) {
    console.error(`Missing ${envVar} in environment. Aborting.`);
    process.exit(3);
  }

  // parse host/user/db from connection string without printing secrets
  let host = "unknown";
  let user = "unknown";
  let database = "unknown";
  try {
    const url = new URL(connStr);
    host = url.hostname;
    user = url.username;
    database = url.pathname ? url.pathname.replace(/^\//, "") : "unknown";
  } catch (err) {
    // ignore parsing errors; we'll attempt connection anyway
  }

  console.log("preflight target:", target);
  console.log("host:", maskHost(host));
  console.log("database:", database);
  console.log("user:", maskUser(user));

  const client = new Client({ connectionString: connStr });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT current_database() AS db, current_user AS user, version() AS version",
    );
    const row = res.rows[0];
    console.log("connection result: OK");
    console.log("current_database():", row.db);
    console.log("current_user():", row.user);
    console.log("version():", row.version.split("\n")[0]);

    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 50",
    );
    console.log(
      "public tables (sample):",
      tablesRes.rows.map((r) => r.table_name).slice(0, 50),
    );
  } catch (err: any) {
    console.error("connection result: FAILED");
    console.error(err.message || err);
    process.exit(4);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(10);
});
