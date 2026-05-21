import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { assertServerEnv } from "../../lib/env";

let pool: Pool | null = null;
let appDbClient: ReturnType<typeof drizzle> | null = null;

export function appDb() {
  if (appDbClient) return appDbClient;

  const env = assertServerEnv();
  pool = new Pool({ connectionString: env.APP_DATABASE_URL });
  appDbClient = drizzle(pool);
  return appDbClient;
}

export function appPool() {
  if (!pool) appDb();
  return pool as Pool;
}

export async function closeAppPool() {
  if (pool) {
    await pool.end();
    pool = null;
    appDbClient = null;
  }
}

export default { appDb, appPool, closeAppPool };
