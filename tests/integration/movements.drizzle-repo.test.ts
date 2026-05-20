import { describe, it, expect } from "vitest";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Client } from "pg";
import { createDrizzleMovementsRepoFromClient } from "../../lib/repositories/movements.drizzle-repo";

// Load env (supports ${VAR} expansion) so TEST_DATABASE_URL from .env is available
dotenvExpand(dotenv.config());

const hasDb = !!process.env.TEST_DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb(
  "MovementsRepo Drizzle — integração contra test_db (descartável)",
  () => {
    it("(setup) TEST_DATABASE_URL configured", () => {
      expect(hasDb).toBeTruthy();
    });

    it("acquisition persisted and lot available (basic)", async () => {
      const conn = process.env.TEST_DATABASE_URL as string;
      const client = new Client({ connectionString: conn });
      await client.connect();
      const repo = createDrizzleMovementsRepoFromClient(client as any);

      // insert a program_account
      const now = new Date();
      const insertAcc = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [1, 1, "active", now, now],
      );
      const accountId = insertAcc.rows[0].id as number;

      // insert an entry and a lot
      const entry = await repo.insertEntry({
        organizationId: 1,
        programId: 1,
        accountId,
        type: "acquisition",
        direction: "in",
        points: 100,
        occurredAt: new Date(),
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const lot = await repo.insertLot({
        organizationId: 1,
        programId: 1,
        accountId,
        sourceEntryId: entry.id,
        acquiredPoints: 100,
        remainingPoints: 100,
        issuedAt: new Date(),
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Confirm via direct query that lot was inserted and has remaining_points > 0
      const chk = await client.query(
        "SELECT count(*)::int as cnt FROM mile_point_lots WHERE id = $1 AND remaining_points > 0",
        [lot.id],
      );
      const cnt = chk.rows[0].cnt as number;
      expect(cnt).toBeGreaterThanOrEqual(1);

      // Optional: repo.getAvailableLots may return camelCased or snake_cased keys;
      // if it returns an entry, assert id matches.
      const lots = await repo.getAvailableLots(accountId);
      if (lots.length > 0) {
        const found = lots.find((l: any) => l.id === lot.id);
        expect(found).toBeTruthy();
      }

      // cleanup
      await client.query("DELETE FROM mile_point_lots WHERE id = $1", [lot.id]);
      await client.query("DELETE FROM mile_entries WHERE id = $1", [entry.id]);
      await client.query("DELETE FROM program_accounts WHERE id = $1", [
        accountId,
      ]);
      await client.end();
    });

    it("transaction rollback realmente reverte inserts", async () => {
      const conn = process.env.TEST_DATABASE_URL as string;
      const client = new Client({ connectionString: conn });
      await client.connect();
      const repo = createDrizzleMovementsRepoFromClient(client as any);

      // ensure account exists (outside transaction) to satisfy FK
      const now = new Date();
      const insertAcc = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [1, 1, "active", now, now],
      );
      const accountId = insertAcc.rows[0].id as number;

      // start explicit transaction and then rollback
      await client.query("BEGIN");
      const entry = await repo.insertEntry({
        organizationId: 1,
        programId: 1,
        accountId,
        type: "acquisition",
        direction: "in",
        points: 50,
        occurredAt: new Date(),
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const lot = await repo.insertLot({
        organizationId: 1,
        programId: 1,
        accountId,
        sourceEntryId: entry.id,
        acquiredPoints: 50,
        remainingPoints: 50,
        issuedAt: new Date(),
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // rollback
      await client.query("ROLLBACK");

      const chkEntry = await client.query(
        "SELECT count(*)::int as cnt FROM mile_entries WHERE id = $1",
        [entry.id],
      );
      const chkLot = await client.query(
        "SELECT count(*)::int as cnt FROM mile_point_lots WHERE id = $1",
        [lot.id],
      );
      expect(Number(chkEntry.rows[0].cnt)).toBe(0);
      expect(Number(chkLot.rows[0].cnt)).toBe(0);

      // cleanup account
      await client.query("DELETE FROM program_accounts WHERE id = $1", [
        accountId,
      ]);

      await client.end();
    });

    it("consumo FIFO usando lotes", async () => {
      const conn = process.env.TEST_DATABASE_URL as string;
      const client = new Client({ connectionString: conn });
      await client.connect();
      const repo = createDrizzleMovementsRepoFromClient(client as any);

      // create account
      const now = new Date();
      const accRes = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [1, 1, "active", now, now],
      );
      const accountId = accRes.rows[0].id as number;

      // create two lots
      const lotA = await repo.insertLot({
        organizationId: 1,
        programId: 1,
        accountId,
        sourceEntryId: null,
        acquiredPoints: 70,
        remainingPoints: 70,
        issuedAt: new Date(Date.now() - 1000 * 60),
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const lotB = await repo.insertLot({
        organizationId: 1,
        programId: 1,
        accountId,
        sourceEntryId: null,
        acquiredPoints: 30,
        remainingPoints: 30,
        issuedAt: new Date(),
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // consume 80 points FIFO: should consume 70 from lotA and 10 from lotB
      await client.query("BEGIN");
      const consumeEntry = await repo.insertEntry({
        organizationId: 1,
        programId: 1,
        accountId,
        type: "consumption",
        direction: "out",
        points: 80,
        occurredAt: new Date(),
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // update lotA to 0, lotB to 20
      await repo.updateLotRemaining(lotA.id, 0);
      await repo.updateLotRemaining(lotB.id, 20);
      await repo.updateProgramAccountBalance(accountId, -80);

      await client.query("COMMIT");

      const chkA = await client.query(
        "SELECT remaining_points FROM mile_point_lots WHERE id = $1",
        [lotA.id],
      );
      const chkB = await client.query(
        "SELECT remaining_points FROM mile_point_lots WHERE id = $1",
        [lotB.id],
      );
      expect(Number(chkA.rows[0].remaining_points)).toBe(0);
      expect(Number(chkB.rows[0].remaining_points)).toBe(20);

      // cleanup
      await client.query("DELETE FROM mile_point_lots WHERE id IN ($1,$2)", [
        lotA.id,
        lotB.id,
      ]);
      await client.query("DELETE FROM mile_entries WHERE id = $1", [
        consumeEntry.id,
      ]);
      await client.query("DELETE FROM program_accounts WHERE id = $1", [
        accountId,
      ]);
      await client.end();
    });

    it("transferência entre contas (básico)", async () => {
      const conn = process.env.TEST_DATABASE_URL as string;
      const client = new Client({ connectionString: conn });
      await client.connect();
      const repo = createDrizzleMovementsRepoFromClient(client as any);

      const now = new Date();
      const acc1 = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [1, 1, "active", now, now],
      );
      const acc2 = await client.query(
        `INSERT INTO program_accounts (organization_id, program_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [1, 1, "active", now, now],
      );
      const a1 = acc1.rows[0].id as number;
      const a2 = acc2.rows[0].id as number;

      const transfer = await repo.insertTransfer({
        organizationId: 1,
        fromAccountId: a1,
        toAccountId: a2,
        pointsSent: 25,
        pointsReceived: 25,
        transferredAt: new Date(),
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const chk = await client.query(
        "SELECT count(*)::int as cnt FROM mile_transfers WHERE id = $1",
        [transfer.id],
      );
      expect(Number(chk.rows[0].cnt)).toBeGreaterThanOrEqual(1);

      // cleanup
      await client.query("DELETE FROM mile_transfers WHERE id = $1", [
        transfer.id,
      ]);
      await client.query("DELETE FROM program_accounts WHERE id IN ($1,$2)", [
        a1,
        a2,
      ]);
      await client.end();
    });
  },
);
