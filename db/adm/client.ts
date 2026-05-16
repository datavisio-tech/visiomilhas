import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { assertServerEnv } from "../../lib/env";

let pool: Pool | null = null;
let admDbClient: ReturnType<typeof drizzle> | null = null;

export function admDb() {
  if (admDbClient) return admDbClient;

  const env = assertServerEnv();
  pool = new Pool({ connectionString: env.ADM_DATABASE_URL });
  admDbClient = drizzle(pool);
  return admDbClient;
}

export function admPool() {
  if (!pool) admDb();
  return pool as Pool;
}

export async function closeAdmPool() {
  if (pool) {
    await pool.end();
    pool = null;
    admDbClient = null;
  }
}

export default { admDb, admPool, closeAdmPool };
