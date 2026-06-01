import { NextResponse } from "next/server";
import { appPool } from "../../../../db/app/client";
import LOYALTY_CATALOG from "../../../../data/loyalty-programs.json";
import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import { resolveSubscriptionAccessContext } from "../../../../lib/server/subscription-access";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body?.slug || "").trim();
    if (!slug)
      return NextResponse.json(
        { success: false, error: "slug required" },
        { status: 400 },
      );

    const sessionContext = await resolveControlledSessionContext({
      source: "api.loyalty.create",
      allowFallback: false,
    });
    if (!sessionContext)
      return NextResponse.json(
        { success: false, error: "unauthenticated" },
        { status: 401 },
      );

    const accessContext = await resolveSubscriptionAccessContext(
      sessionContext,
      {
        source: "api.loyalty.create",
      },
    );

    if (!accessContext) {
      return NextResponse.json(
        { success: false, error: "access_context_missing" },
        { status: 403 },
      );
    }

    const canWrite =
      accessContext.accessState === "ACTIVE" ||
      accessContext.accessState === "TRIAL";
    if (!canWrite) {
      return NextResponse.json(
        { success: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const organizationId = sessionContext.ownership.organizationId;
    if (!organizationId)
      return NextResponse.json(
        { success: false, error: "organization not found" },
        { status: 400 },
      );

    const catalogEntry = (LOYALTY_CATALOG as any[]).find(
      (p) => p.slug === slug,
    );
    if (!catalogEntry)
      return NextResponse.json(
        { success: false, error: "catalog entry not found" },
        { status: 404 },
      );

    const pool = appPool();
    const client = await pool.connect();
    try {
      // return existing if present
      const check = await client.query(
        `SELECT id, name, slug, color FROM loyalty_programs WHERE slug = $1 AND organization_id = $2 LIMIT 1`,
        [slug, organizationId],
      );
      if (check.rows.length) {
        const row = check.rows[0];
        return NextResponse.json({
          success: true,
          programId: row.id,
          program: {
            id: row.id,
            name: row.name,
            slug: row.slug,
            color: row.color,
          },
        });
      }

      const type = (catalogEntry.program_type || catalogEntry.type || "")
        .toString()
        .toLowerCase();
      const country = catalogEntry.country_code || null;
      const color = catalogEntry.brand_color || null;
      const isSystemDefault = Boolean(
        catalogEntry.is_featured || catalogEntry.is_system_default,
      );
      const metadata = {
        short_name: catalogEntry.short_name || null,
        description: catalogEntry.description || null,
        icon: catalogEntry.icon || null,
      };

      const insert = await client.query(
        `INSERT INTO loyalty_programs (organization_id, name, slug, type, country, color, is_system_default, is_active, metadata, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id, name, slug, color`,
        [
          organizationId,
          catalogEntry.name,
          slug,
          type,
          country,
          color,
          isSystemDefault,
          true,
          JSON.stringify(metadata),
        ],
      );

      const row = insert.rows[0];
      return NextResponse.json({
        success: true,
        programId: row.id,
        program: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          color: row.color,
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 },
    );
  }
}
