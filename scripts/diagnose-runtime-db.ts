import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Client } from "pg";

const env = dotenv.config();
dotenvExpand(env);

const runtimeVar = process.env.APP_DATABASE_URL
  ? "APP_DATABASE_URL"
  : "DATABASE_URL";
const conn = process.env[runtimeVar];

function maskHost(host: string) {
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
  if (!conn) {
    console.error(
      "No runtime database URL found in APP_DATABASE_URL or DATABASE_URL.",
    );
    process.exit(2);
  }

  let host = "unknown";
  let user = "unknown";
  try {
    const url = new URL(conn);
    host = url.hostname;
    user = url.username;
  } catch {
    // keep masked output generic if parsing fails
  }

  console.log("runtime db variable:", runtimeVar);
  console.log("host:", maskHost(host));
  console.log("user:", maskUser(user));

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();

    const context = await client.query(
      "SELECT current_database() AS db, current_user AS user",
    );
    console.log("current_database():", context.rows[0]?.db ?? "unknown");
    console.log("current_user():", context.rows[0]?.user ?? "unknown");

    for (const table of [
      "program_accounts",
      "mile_entries",
      "mile_point_lots",
    ]) {
      const result = await client.query(
        `SELECT EXISTS(
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = $1
         ) AS exists`,
        [table],
      );
      console.log(`${table}:`, result.rows[0]?.exists ? "FOUND" : "MISSING");
    }
  } finally {
    await client.end();
  }
}

main().catch((error: any) => {
  console.error("Error (sanitized):", error?.message || error);
  process.exit(10);
});
