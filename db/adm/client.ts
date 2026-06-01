import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as betterAuthSchema from "../../lib/server/better-auth-schema";
import { assertServerEnv } from "../../lib/env";

let pool: Pool | null = null;
let admDbClient: ReturnType<typeof drizzle> | null = null;

export function admDb() {
  if (admDbClient) return admDbClient;

  const env = assertServerEnv();
  pool = new Pool({ connectionString: env.ADM_DATABASE_URL });
  // Attach a minimal schema to the Drizzle client so adapters (e.g. Better Auth
  // drizzle adapter) can resolve model mappings at runtime. This is a
  // non-invasive change that does not alter the database itself.
  admDbClient = drizzle(pool, { schema: betterAuthSchema as any });
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
