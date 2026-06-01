import { admPool, closeAdmPool } from "../db/adm/client";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const myEnv = dotenv.config();
dotenvExpand(myEnv as any);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/force-subscription-active.ts <email>");
    process.exit(2);
  }

  const pool = admPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      "SELECT id FROM global_users WHERE email = $1 LIMIT 1",
      [email],
    );
    if (!userRes.rows.length) {
      throw new Error("User not found: " + email);
    }
    const userId = userRes.rows[0].id;

    const membershipRes = await client.query(
      "SELECT organization_id FROM organization_memberships WHERE user_id = $1 LIMIT 1",
      [userId],
    );
    if (!membershipRes.rows.length) {
      throw new Error("Organization membership not found for user: " + email);
    }
    const orgId = membershipRes.rows[0].organization_id;

    const subRes = await client.query(
      "SELECT id FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [orgId],
    );

    if (!subRes.rows.length) {
      throw new Error("No subscription found for organization: " + orgId);
    }

    const subId = subRes.rows[0].id;

    await client.query(
      `UPDATE subscriptions SET status = 'active', access_state = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [subId],
    );

    await client.query("COMMIT");
    console.log("Subscription set to active for orgId=", orgId);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await closeAdmPool();
  }
}

void main();
