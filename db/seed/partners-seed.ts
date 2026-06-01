import { appPool } from "../app/client";

const PARTNERS = [
  {
    slug: "casas-bahia",
    name: "Casas Bahia",
    logo: "/partners/default-store.svg",
    website: "https://www.casasbahia.com.br",
  },
  {
    slug: "mercado-livre",
    name: "Mercado Livre",
    logo: "/partners/mercado-livre.svg",
    website: "https://www.mercadolivre.com.br",
  },
  {
    slug: "magalu",
    name: "Magazine Luiza",
    logo: "/partners/default-store.svg",
    website: "https://www.magazineluiza.com.br",
  },
  {
    slug: "shopee",
    name: "Shopee",
    logo: "/partners/default-store.svg",
    website: "https://shopee.com.br",
  },
  {
    slug: "booking",
    name: "Booking",
    logo: "/partners/default-store.svg",
    website: "https://www.booking.com",
  },
  {
    slug: "extra",
    name: "Extra",
    logo: "/partners/default-store.svg",
    website: "https://www.extra.com.br",
  },
  {
    slug: "boticario",
    name: "Boticario",
    logo: "/partners/default-store.svg",
    website: "https://www.boticario.com.br",
  },
];

export async function seedPartners(organizationId: number) {
  const pool = appPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of PARTNERS) {
      const q = await client.query(
        `SELECT id FROM partner_stores WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
        [p.slug, organizationId],
      );
      if (!q.rows.length) {
        await client.query(
          `INSERT INTO partner_stores (organization_id, slug, name, logo_url, website_url, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
          [organizationId, p.slug, p.name, p.logo, p.website],
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default seedPartners;
