import { describe, it, expect, beforeEach } from "vitest";
import * as useCases from "../movements.use-cases";
import { MovementsRepo } from "../movements";

// Reuse in-memory repo from movements tests pattern
function createInMemoryRepo(): MovementsRepo & { runInTransaction?: any } {
  let entrySeq = 1;
  let lotSeq = 1;
  let transferSeq = 1;
  const accounts = new Map<number, { id: number; balance: number }>();
  const entries: any[] = [];
  const lots: any[] = [];
  const transfers: any[] = [];
  accounts.set(1, { id: 1, balance: 0 });
  accounts.set(2, { id: 2, balance: 0 });

  const repo: any = {
    async findAccountById(accountId: number) {
      const a = accounts.get(accountId) ?? null;
      return a ? { id: a.id } : null;
    },
    async insertEntry(entry: any) {
      const id = entrySeq++;
      entries.push({ id, ...entry });
      return { id };
    },
    async insertLot(lot: any) {
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
      return lots
        .filter((l) => l.accountId === accountId && l.remainingPoints > 0)
        .sort((a, b) => a.id - b.id);
    },
    async insertTransfer(transfer: any) {
      const id = transferSeq++;
      transfers.push({ id, ...transfer });
      return { id };
    },
  };

  // Add runInTransaction that simply calls cb with the same repo (tx emulada)
  repo.runInTransaction = async (cb: any) => cb(repo);
  return repo as any;
}

describe("movements use-cases (unit, mocked repo)", () => {
  let repo: ReturnType<typeof createInMemoryRepo>;

  beforeEach(() => {
    repo = createInMemoryRepo();
  });

  it("acquireMilesUseCase delegates to service and returns result", async () => {
    const res = await useCases.acquireMilesUseCase(
      { accountId: 1, amount: 100 },
      repo as any,
    );
    expect(res.acquiredPoints).toBe(100);
  });

  it("consumeMilesUseCase delegates to service and consumes points", async () => {
    // seed
    await useCases.acquireMilesUseCase(
      { accountId: 1, amount: 200 },
      repo as any,
    );
    const consumed = await useCases.consumeMilesUseCase(
      { accountId: 1, amount: 50 },
      repo as any,
    );
    expect(consumed.consumedPoints).toBe(50);
  });

  it("transferMilesUseCase delegates to service and returns transferId", async () => {
    await useCases.acquireMilesUseCase(
      { accountId: 1, amount: 120 },
      repo as any,
    );
    const t = await useCases.transferMilesUseCase(
      { fromAccountId: 1, toAccountId: 2, amount: 20 },
      repo as any,
    );
    expect(t.transferId).toBeDefined();
  });
});
