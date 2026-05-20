import { describe, it, expect } from "vitest";
import { Client } from "pg";
import { createDrizzleMovementsRepoFromClient } from "../../lib/repositories/movements.drizzle-repo";

const hasDb = !!process.env.TEST_DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("MovementsRepo Drizzle — integração contra test_db (descartável)", () => {
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

    const lots = await repo.getAvailableLots(accountId);
    expect(lots.length).toBeGreaterThanOrEqual(1);
    const found = lots.find((l) => l.id === lot.id);
    expect(found).toBeTruthy();

    // cleanup
    await client.query("DELETE FROM mile_point_lots WHERE id = $1", [lot.id]);
    await client.query("DELETE FROM mile_entries WHERE id = $1", [entry.id]);
    await client.query("DELETE FROM program_accounts WHERE id = $1", [accountId]);
    await client.end();
  });
});

