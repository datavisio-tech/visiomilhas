import { appPool } from "../../db/app/client";

export async function getProgramsOverview(orgSlug = "demo-visiomilhas") {
  const pool = appPool();
  const client = await pool.connect();
  try {
    const orgRes = await client.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [orgSlug],
    );
    if (!orgRes.rows.length) return [];
    const orgId = orgRes.rows[0].id;

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
}

const programsApi = { getProgramsOverview };

export default programsApi;
