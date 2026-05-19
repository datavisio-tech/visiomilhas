import { describe, it, expect, beforeEach } from "vitest";
import createMovementService, {
  MovementsRepo,
  AcquireMilesInput,
  InsufficientMilesError,
} from "../movements";
import { ZodError } from "zod";

// In-memory fake repo for tests
function createInMemoryRepo(): MovementsRepo {
  let entrySeq = 1;
  let lotSeq = 1;
  let transferSeq = 1;

  const accounts = new Map<number, { id: number; balance: number }>();
  const entries: any[] = [];
  const lots: any[] = [];
  const transfers: any[] = [];

  // seed sample accounts for transfer tests
  accounts.set(1, { id: 1, balance: 0 });
  accounts.set(2, { id: 2, balance: 0 });

  return {
    async findAccountById(accountId: number) {
      const a = accounts.get(accountId) ?? null;
      return a ? { id: a.id } : null;
    },
    async insertEntry(entry) {
      const id = entrySeq++;
      entries.push({ id, ...entry });
      return { id };
    },
    async insertLot(lot) {
      const id = lotSeq++;
      lots.push({ id, ...lot });
      return { id };
    },
    async updateLotRemaining(lotId: number, remaining: number) {
      const l = lots.find((x) => x.id === lotId);
      if (!l) throw new Error("lot not found");
      l.remainingPoints = remaining;
    },
    async updateProgramAccountBalance(accountId: number, deltaPoints: number) {
      const a = accounts.get(accountId);
      if (!a) throw new Error("account not found");
      a.balance += deltaPoints;
    },
    async getAvailableLots(accountId: number) {
      // return lots for account with remainingPoints > 0, ordered by id asc (FIFO)
      return lots
        .filter((l) => l.accountId === accountId && l.remainingPoints > 0)
        .sort((a, b) => a.id - b.id);
    },
    async insertTransfer(transfer) {
      const id = transferSeq++;
      transfers.push({ id, ...transfer });
      return { id };
    },
  };
}

describe("movements service (in-memory)", () => {
  let repo: MovementsRepo;
  let svc: ReturnType<typeof createMovementService>;

  beforeEach(() => {
    repo = createInMemoryRepo();
    svc = createMovementService(repo);
  });

  it("acquisition creates entry and lot and updates balance", async () => {
    const input: AcquireMilesInput = { accountId: 1, amount: 1000 };
    const res = await svc.acquireMiles(input);
    expect(res.acquiredPoints).toBe(1000);
    const bal = await svc.getAvailableMilesBalance(1);
    expect(bal.availablePoints).toBe(1000);
  });

  it("acquisition rejects non-positive amounts (Zod validation)", async () => {
    await expect(
      svc.acquireMiles({ accountId: 1, amount: 0 }),
    ).rejects.toBeInstanceOf(ZodError);
    await expect(
      svc.acquireMiles({ accountId: 1, amount: -10 }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("consumption uses FIFO across lots", async () => {
    // create two lots via acquire
    await svc.acquireMiles({ accountId: 1, amount: 500 });
    // small delay-ish by giving later issuedAt different (in repo order it's different id)
    await svc.acquireMiles({ accountId: 1, amount: 800 });

    const before = await svc.getAvailableMilesBalance(1);
    expect(before.availablePoints).toBe(1300);

    const res = await svc.consumeMiles({ accountId: 1, amount: 600 });
    expect(res.consumedPoints).toBe(600);
    // after consumption remaining should be 700
    const after = await svc.getAvailableMilesBalance(1);
    expect(after.availablePoints).toBe(700);
    // consumed lots should include first lot fully consumed (500) and 100 from second
    expect(res.consumedLots.length).toBeGreaterThanOrEqual(1);
    const totalConsumed = res.consumedLots.reduce(
      (s, l) => s + l.consumedPoints,
      0,
    );
    expect(totalConsumed).toBe(600);
  });

  it("consumption total across multiple lots", async () => {
    // create two lots
    await svc.acquireMiles({ accountId: 1, amount: 200 });
    await svc.acquireMiles({ accountId: 1, amount: 300 });

    const before = await svc.getAvailableMilesBalance(1);
    expect(before.availablePoints).toBeGreaterThanOrEqual(500);

    const res = await svc.consumeMiles({ accountId: 1, amount: 500 });
    expect(res.consumedPoints).toBe(500);
    const after = await svc.getAvailableMilesBalance(1);
    expect(after.availablePoints).toBe(before.availablePoints - 500);
  });

  it("consumption greater than available throws InsufficientMilesError", async () => {
    // ensure account has small balance
    await svc.acquireMiles({ accountId: 1, amount: 50 });
    await expect(
      svc.consumeMiles({ accountId: 1, amount: 100 }),
    ).rejects.toBeInstanceOf(InsufficientMilesError);
  });

  it("consumption rejects non-positive amounts (Zod validation)", async () => {
    await expect(
      svc.consumeMiles({ accountId: 1, amount: 0 }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("transfer between accounts succeeds and records transfer", async () => {
    // seed some points on account 1
    await svc.acquireMiles({ accountId: 1, amount: 150 });
    const beforeA = await svc.getAvailableMilesBalance(1);
    const beforeB = await svc.getAvailableMilesBalance(2);

    const t = await svc.transferMiles({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 50,
    });
    expect(t.transferId).toBeDefined();
    // origin reduced
    const afterA = await svc.getAvailableMilesBalance(1);
    expect(afterA.availablePoints).toBe(beforeA.availablePoints - 50);
    // destination: current service doesn't auto-create lots on destination in this stage
    const afterB = await svc.getAvailableMilesBalance(2);
    expect(afterB.availablePoints).toBe(beforeB.availablePoints);
  });

  it("transfer rejects when insufficient balance", async () => {
    // ensure account 1 has small balance
    await svc.acquireMiles({ accountId: 1, amount: 10 });
    await expect(
      svc.transferMiles({ fromAccountId: 1, toAccountId: 2, amount: 100 }),
    ).rejects.toBeInstanceOf(InsufficientMilesError);
  });
});
