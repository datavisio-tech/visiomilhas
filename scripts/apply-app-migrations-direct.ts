import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { appPool } from "../db/app/client";

const env = dotenv.config();
dotenvExpand(env as any);

async function run() {
  console.log("APP_DATABASE_URL=", process.env.APP_DATABASE_URL);
  const migrationsDir = path.join(__dirname, "..", "db", "app", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  console.log("found migration files:", files);
  const pool = appPool();
  const client = await pool.connect();
  try {
    for (const f of files) {
      const p = path.join(migrationsDir, f);
      const sql = fs.readFileSync(p, "utf8");
      console.log("applying", f);
      try {
        await client.query(sql);
        console.log("applied", f);
      } catch (err) {
        console.error("error applying", f, err);
      }
    }
  } finally {
    client.release();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
