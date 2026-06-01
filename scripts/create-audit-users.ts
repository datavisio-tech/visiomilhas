import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { admPool, closeAdmPool } from "../db/adm/client";

const myEnv = dotenv.config();
dotenvExpand(myEnv as any);

function slugFromEmail(email: string) {
  return email
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .replace(/-+/g, "-");
}

async function ensureUser(email: string, name?: string) {
  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRes = await client.query(
      "SELECT id FROM global_users WHERE email = $1 LIMIT 1",
      [email],
    );
    let userId: number;
    if (userRes.rows.length) {
      userId = userRes.rows[0].id;
    } else {
      const insert = await client.query(
        "INSERT INTO global_users (name, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id",
        [name || email, email],
      );
      userId = insert.rows[0].id;
    }

    // ensure organization per user
    const orgSlug = `audit-${slugFromEmail(email)}`;
    const orgRes = await client.query(
      "SELECT id FROM organizations WHERE slug = $1 LIMIT 1",
      [orgSlug],
    );
    let orgId: number;
    if (orgRes.rows.length) {
      orgId = orgRes.rows[0].id;
    } else {
      const insertOrg = await client.query(
        "INSERT INTO organizations (name, slug, owner_user_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
        [name || `Audit ${email}`, orgSlug, userId, "active"],
      );
      orgId = insertOrg.rows[0].id;
    }

    // ensure membership
    const memRes = await client.query(
      "SELECT id FROM organization_memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1",
      [orgId, userId],
    );
    if (!memRes.rows.length) {
      await client.query(
        "INSERT INTO organization_memberships (organization_id, user_id, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
        [orgId, userId, "owner", "active"],
      );
    }

    await client.query("COMMIT");
    return { userId, orgId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function removeSubscriptions(orgId: number) {
  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM subscriptions WHERE organization_id = $1", [
      orgId,
    ]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function createTrial(orgId: number, planCode = "free_trial") {
  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planRes = await client.query(
      "SELECT id FROM plans WHERE code = $1 LIMIT 1",
      [planCode],
    );
    const planId = planRes.rows.length ? planRes.rows[0].id : null;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15);
    await client.query(
      `INSERT INTO subscriptions (organization_id, plan_id, status, trial_starts_at, trial_ends_at, trial_started_at, trial_expires_at, activated_at, access_state, plan_type, tenant_state, cancel_at_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        orgId,
        planId,
        "trialing",
        now,
        trialEnd,
        now,
        trialEnd,
        now,
        "TRIAL",
        planCode,
        "active",
        false,
      ],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function setActive(orgId: number) {
  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const subRes = await client.query(
      "SELECT id FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [orgId],
    );
    if (subRes.rows.length) {
      const id = subRes.rows[0].id;
      await client.query(
        `UPDATE subscriptions SET status = 'active', access_state = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id],
      );
    } else {
      // insert basic active subscription
      const planRes = await client.query(
        "SELECT id FROM plans WHERE code = $1 LIMIT 1",
        ["pro_monthly"],
      );
      const planId = planRes.rows.length ? planRes.rows[0].id : null;
      await client.query(
        `INSERT INTO subscriptions (organization_id, plan_id, status, activated_at, access_state, plan_type, tenant_state, cancel_at_period_end, created_at, updated_at) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, NOW(), NOW())`,
        [
          orgId,
          planId,
          "active",
          "ACTIVE",
          planId ? "pro_monthly" : "pro_monthly",
          "active",
          false,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // emailteste03 -> AUTH_NO_SUB
    const u3 = await ensureUser("emailteste03@teste.com", "Audit Test 03");
    await removeSubscriptions(u3.orgId);
    console.log("Created/ensured emailteste03 with no subscription", u3);

    // emailteste04 -> TRIAL
    const u4 = await ensureUser("emailteste04@teste.com", "Audit Test 04");
    await removeSubscriptions(u4.orgId);
    await createTrial(u4.orgId);
    console.log("Created/ensured emailteste04 with TRIAL", u4);

    // demo@visiomilhas.local -> ACTIVE
    const demo = await ensureUser("demo@visiomilhas.local", "Demo");
    await setActive(demo.orgId);
    console.log("Ensured demo@visiomilhas.local ACTIVE", demo);

    await closeAdmPool();
  } catch (err) {
    console.error("Failed to create audit users:", err);
    process.exit(1);
  }
}

void main();
