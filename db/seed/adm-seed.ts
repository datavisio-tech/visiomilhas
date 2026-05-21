import { admPool } from "../../db/adm/client";
import { DEMO_ADMIN } from "./demo-data";

export async function seedAdm(): Promise<number> {
  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // global_users
    const userRes = await client.query(
      `SELECT id FROM global_users WHERE email = $1 LIMIT 1`,
      [DEMO_ADMIN.user.email],
    );
    let userId: number;
    if (userRes.rows.length) {
      userId = userRes.rows[0].id;
    } else {
      const insertUser = await client.query(
        `INSERT INTO global_users (name, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
        [DEMO_ADMIN.user.name, DEMO_ADMIN.user.email],
      );
      userId = insertUser.rows[0].id;
    }

    // organizations
    const orgRes = await client.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [DEMO_ADMIN.organization.slug],
    );
    let orgId: number;
    if (orgRes.rows.length) {
      orgId = orgRes.rows[0].id;
    } else {
      const insertOrg = await client.query(
        `INSERT INTO organizations (name, slug, owner_user_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        [
          DEMO_ADMIN.organization.name,
          DEMO_ADMIN.organization.slug,
          userId,
          "active",
        ],
      );
      orgId = insertOrg.rows[0].id;
    }

    // membership (idempotent by checking existence)
    const memRes = await client.query(
      `SELECT id FROM organization_memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
      [orgId, userId],
    );
    if (!memRes.rows.length) {
      await client.query(
        `INSERT INTO organization_memberships (organization_id, user_id, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [orgId, userId, "owner", "active"],
      );
    }

    // plans
    for (const p of DEMO_ADMIN.plans) {
      const pRes = await client.query(
        `SELECT id FROM plans WHERE code = $1 LIMIT 1`,
        [p.code],
      );
      if (!pRes.rows.length) {
        await client.query(
          `INSERT INTO plans (code, name, price_cents, currency, billing_interval, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [p.code, p.name, 0, "BRL", "monthly", true],
        );
      }
    }

    // subscription trial for org (idempotent)
    const subRes = await client.query(
      `SELECT id FROM subscriptions WHERE organization_id = $1 AND status = $2 LIMIT 1`,
      [orgId, "trialing"],
    );
    if (!subRes.rows.length) {
      const trialStart = new Date();
      // prefer explicit trialDays from demo config or fallback to 15
      const demoTrialDays =
        (DEMO_ADMIN.plans.find((x) => x.code === "free_trial")?.trialDays as
          | number
          | undefined) ||
        (DEMO_ADMIN as any).trialDays ||
        15;
      const trialEnd = new Date(
        trialStart.getTime() + 1000 * 60 * 60 * 24 * demoTrialDays,
      );
      const trialPlanCode =
        DEMO_ADMIN.plans.find((x) => x.code === "free_trial")?.code ||
        DEMO_ADMIN.plans[0].code;
      await client.query(
        `INSERT INTO subscriptions (organization_id, plan_id, status, trial_starts_at, trial_ends_at, cancel_at_period_end, created_at, updated_at) VALUES ($1, (SELECT id FROM plans WHERE code = $2 LIMIT 1), $3, $4, $5, $6, NOW(), NOW())`,
        [orgId, trialPlanCode, "trialing", trialStart, trialEnd, false],
      );
    }

    await client.query("COMMIT");
    return orgId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default seedAdm;
