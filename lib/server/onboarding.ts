import { admPool } from "../../db/adm/client";

export async function ensureGlobalUser(
  email: string | null | undefined,
  name?: string | null | undefined,
  image?: string | null | undefined,
): Promise<number | null> {
  if (!email) return null;

  const pool = admPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id FROM global_users WHERE email = $1 LIMIT 1`,
      [email.trim()],
    );

    if (res.rows.length > 0) {
      return Number(res.rows[0].id);
    }

    const insert = await client.query(
      `INSERT INTO global_users (name, email, image, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [name ?? email, email.trim(), image ?? null],
    );

    return Number(insert.rows[0].id);
  } finally {
    client.release();
  }
}
