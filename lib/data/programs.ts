import { appPool } from "../../db/app/client";
import { admPool } from "../../db/adm/client";
import { isMissingRelationError } from "./db-errors";

export async function getProgramsOverview(orgSlug = "demo-visiomilhas") {
  const admClient = await admPool().connect();
  try {
    const orgRes = await admClient.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [orgSlug],
    );
    if (!orgRes.rows.length) return [];
    const orgId = orgRes.rows[0].id;

    const pool = appPool();
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, name, slug, type, country, currency_label, is_active FROM loyalty_programs WHERE organization_id = $1 ORDER BY name`,
        [orgId],
      );

      return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        type: r.type,
        country: r.country,
        currencyLabel: r.currency_label,
        isActive: r.is_active,
      }));
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (isMissingRelationError(err)) return [];
    throw err;
  } finally {
    admClient.release();
  }
}

const programsApi = { getProgramsOverview };

export default programsApi;
