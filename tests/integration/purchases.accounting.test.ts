import { describe, it, expect, beforeAll } from "vitest";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Client } from "pg";
import {
  registerPurchase,
  changePurchaseStatus,
} from "../../src/modules/purchases/application/services";

dotenvExpand(dotenv.config());

if (process.env.TEST_DATABASE_URL) {
  process.env.ADM_DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.APP_DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.APP_NAME = "VisioMilhas Test";
  process.env.APP_URL = "http://localhost:3001";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
}

const hasDb = !!process.env.TEST_DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

async function ensurePurchaseTables(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS purchase_records (
      id serial PRIMARY KEY,
      organization_id integer NOT NULL,
      account_id integer,
      program_id integer,
      partner_store_id integer,
      partner_campaign_id integer,
      title varchar(255),
      order_number varchar(255),
      purchase_date timestamp,
      purchase_amount_cents integer,
      freight_cents integer,
      other_costs_cents integer,
      expected_points integer,
      credited_points integer,
      multiplier integer,
      status varchar(50) NOT NULL DEFAULT 'PENDING',
      expected_credit_date timestamp,
      credited_at timestamp,
      notes text,
      created_at timestamp NOT NULL DEFAULT NOW(),
      updated_at timestamp NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS purchase_status_history (
      id serial PRIMARY KEY,
      purchase_id integer NOT NULL,
      old_status varchar(50),
      new_status varchar(50) NOT NULL,
      notes text,
      created_at timestamp NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS purchase_evidences (
      id serial PRIMARY KEY,
      purchase_id integer NOT NULL,
      file_name varchar(1024),
      file_type varchar(255),
      file_url varchar(2048),
      uploaded_at timestamp
    )
  `);
}

describeIfDb("Purchases accounting integration", () => {
  beforeAll(async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    try {
      await ensurePurchaseTables(client);
    } finally {
      await client.end();
    }
  });

  it("creates entry, lot and balance on RECEIVED", async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    try {
      const now = new Date();
      const accountRes = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, current_points_balance, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [1, 1, "active", 0, now, now],
      );
      const accountId = Number(accountRes.rows[0].id);

      const purchase = await registerPurchase({
        organizationId: 1,
        accountId,
        programId: 1,
        title: "Compra Bonificada",
        orderNumber: `int-${Date.now()}`,
        purchaseAmountCents: 12300,
        expectedPoints: 123,
        status: "PENDING_CREDIT",
        createdAt: now,
        updatedAt: now,
      });

      await changePurchaseStatus(purchase.id, "RECEIVED", "credited");

      const entry = await client.query(
        `SELECT id, points, related_entity_id FROM mile_entries WHERE related_entity_type = 'purchase_record' AND related_entity_id = $1 LIMIT 1`,
        [String(purchase.id)],
      );
      const lot = await client.query(
        `SELECT source_entry_id, acquired_points, remaining_points, status FROM mile_point_lots WHERE source_entry_id = $1 LIMIT 1`,
        [entry.rows[0].id],
      );
      const balance = await client.query(
        `SELECT current_points_balance FROM program_accounts WHERE id = $1`,
        [accountId],
      );

      expect(Number(entry.rows[0].points)).toBe(123);
      expect(Number(lot.rows[0].source_entry_id)).toBe(
        Number(entry.rows[0].id),
      );
      expect(Number(lot.rows[0].acquired_points)).toBe(123);
      expect(Number(lot.rows[0].remaining_points)).toBe(123);
      expect(Number(balance.rows[0].current_points_balance)).toBe(123);
    } finally {
      await client.end();
    }
  });

  it("reversal closes lot and restores balance", async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    try {
      const now = new Date();
      const accountRes = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, current_points_balance, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [1, 1, "active", 0, now, now],
      );
      const accountId = Number(accountRes.rows[0].id);

      const purchase = await registerPurchase({
        organizationId: 1,
        accountId,
        programId: 1,
        title: "Compra Bonificada",
        orderNumber: `rev-${Date.now()}`,
        purchaseAmountCents: 4500,
        expectedPoints: 45,
        status: "PENDING_CREDIT",
        createdAt: now,
        updatedAt: now,
      });

      await changePurchaseStatus(purchase.id, "RECEIVED", "credited");
      await changePurchaseStatus(purchase.id, "PROBLEM", "reversal");

      const bonus = await client.query(
        `SELECT id, reversed_at, status FROM mile_entries WHERE related_entity_type = 'purchase_record' AND related_entity_id = $1 LIMIT 1`,
        [String(purchase.id)],
      );
      const reversal = await client.query(
        `SELECT id, points FROM mile_entries WHERE related_entity_type = 'purchase_record' AND related_entity_id = $1 LIMIT 1`,
        [String(purchase.id) + ":reversal"],
      );
      const lot = await client.query(
        `SELECT remaining_points, status FROM mile_point_lots WHERE source_entry_id = $1 LIMIT 1`,
        [bonus.rows[0].id],
      );
      const balance = await client.query(
        `SELECT current_points_balance FROM program_accounts WHERE id = $1`,
        [accountId],
      );

      expect(reversal.rows[0]).toBeTruthy();
      expect(bonus.rows[0].status).toBe("reversed");
      expect(Number(lot.rows[0].remaining_points)).toBe(0);
      expect(lot.rows[0].status).toBe("reversed");
      expect(Number(balance.rows[0].current_points_balance)).toBe(0);
    } finally {
      await client.end();
    }
  }, 10000);

  it("restores accounting on PROBLEM -> RECEIVED", async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    try {
      const now = new Date();
      const accountRes = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, current_points_balance, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [1, 1, "active", 0, now, now],
      );
      const accountId = Number(accountRes.rows[0].id);

      const purchase = await registerPurchase({
        organizationId: 1,
        accountId,
        programId: 1,
        title: "Compra Bonificada",
        orderNumber: `pb-${Date.now()}`,
        purchaseAmountCents: 3000,
        expectedPoints: 30,
        status: "PENDING_CREDIT",
        createdAt: now,
        updatedAt: now,
      });

      await changePurchaseStatus(purchase.id, "RECEIVED", "credited");
      await changePurchaseStatus(purchase.id, "PROBLEM", "reversal");

      await expect(
        changePurchaseStatus(purchase.id, "RECEIVED", "retry"),
      ).resolves.toEqual({ id: purchase.id, status: "RECEIVED" });

      const bonus = await client.query(
        `SELECT id, status FROM mile_entries WHERE related_entity_type = 'purchase_record' AND related_entity_id = $1 LIMIT 1`,
        [String(purchase.id)],
      );
      const lot = await client.query(
        `SELECT remaining_points, status FROM mile_point_lots WHERE source_entry_id = $1 LIMIT 1`,
        [bonus.rows[0].id],
      );
      const balance = await client.query(
        `SELECT current_points_balance FROM program_accounts WHERE id = $1`,
        [accountId],
      );

      expect(bonus.rows[0].status).toBe("posted");
      expect(lot.rows[0].status).toBe("available");
      expect(Number(lot.rows[0].remaining_points)).toBe(30);
      expect(Number(balance.rows[0].current_points_balance)).toBe(30);
    } finally {
      await client.end();
    }
  }, 10000);
});
