import { z } from "zod";

/* eslint-disable no-unused-vars */

// Types
export type AcquireMilesInput = {
  organizationId?: number;
  accountId: number;
  amount: number;
  source?: string;
  description?: string;
  occurredAt?: Date;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
};

export type ConsumeMilesInput = {
  organizationId?: number;
  accountId: number;
  amount: number;
  reason?: string;
  description?: string;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
};

export type TransferMilesInput = {
  organizationId?: number;
  fromAccountId: number;
  toAccountId?: number | null;
  amount: number;
  reason?: string;
  description?: string;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
};

// Validation schemas
const acquireMilesInputSchema = z.object({
  organizationId: z.number().optional(),
  accountId: z.number().int().positive(),
  amount: z.number().int().positive(),
  source: z.string().optional(),
  description: z.string().optional(),
  occurredAt: z.date().optional(),
  expiresAt: z.date().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const consumeMilesInputSchema = z.object({
  organizationId: z.number().optional(),
  accountId: z.number().int().positive(),
  amount: z.number().int().positive(),
  reason: z.string().optional(),
  description: z.string().optional(),
  occurredAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const transferMilesInputSchema = z.object({
  organizationId: z.number().optional(),
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive().optional(),
  amount: z.number().int().positive(),
  reason: z.string().optional(),
  description: z.string().optional(),
  occurredAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Errors
export class MovementServiceError extends Error {}
export class InsufficientMilesError extends MovementServiceError {}
export class InvalidMovementAmountError extends MovementServiceError {}
export class AccountNotFoundError extends MovementServiceError {}

// Repo interface (minimal) — implementations can wrap Drizzle
export type PointLot = {
  id: number;
  accountId: number;
  acquiredPoints: number;
  remainingPoints: number;
  issuedAt: Date;
  expiresAt?: Date | null;
  sourceEntryId?: number | null;
};

export type MileEntryRecord = {
  id?: number;
  organizationId?: number | null;
  programId?: number | null;
  accountId?: number | null;
  type?: string;
  direction?: string;
  points?: number;
  amountCents?: number | null;
  occurredAt?: Date;
  description?: string | null;
  source?: string | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
  consumedLotId?: number | null;
  consumedPoints?: number | null;
  lotSnapshot?: Record<string, unknown> | null;
};

export type MilePointLotRecord = {
  id?: number;
  organizationId?: number | null;
  programId?: number | null;
  accountId: number;
  sourceEntryId?: number | null;
  acquiredPoints: number;
  remainingPoints: number;
  totalCostCents?: number | null;
  costPerThousandCents?: number | null;
  issuedAt?: Date;
  expiresAt?: Date | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TransferRecord = {
  id?: number;
  organizationId?: number | null;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  pointsSent?: number;
  pointsReceived?: number;
  transferredAt?: Date;
  status?: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MovementsRepo = {
  findAccountById(_accountId: number): Promise<{ id: number } | null>;
  insertEntry(_entry: MileEntryRecord): Promise<{ id: number }>;
  insertLot(_lot: MilePointLotRecord): Promise<{ id: number }>;
  updateLotRemaining(_lotId: number, _remaining: number): Promise<void>;
  updateProgramAccountBalance(
    _accountId: number,
    _deltaPoints: number,
  ): Promise<void>;
  getAvailableLots(_accountId: number): Promise<PointLot[]>;
  insertTransfer?(_transfer: TransferRecord): Promise<{ id: number }>;
};

// Results
export type AcquireMilesResult = {
  entryId: number;
  lotId: number;
  acquiredPoints: number;
  remainingPoints: number;
};

export type ConsumedLot = {
  lotId: number;
  consumedPoints: number;
  remainingPointsAfterConsumption: number;
};

export type ConsumeMilesResult = {
  movementId?: number;
  accountId: number;
  consumedPoints: number;
  consumedLots: ConsumedLot[];
};

// Service implementation
export function createMovementService(repo: MovementsRepo) {
  if (!repo) throw new Error("repo is required");

  async function acquireMiles(
    input: AcquireMilesInput,
  ): Promise<AcquireMilesResult> {
    const data = acquireMilesInputSchema.parse(input);

    if (data.amount <= 0)
      throw new InvalidMovementAmountError("amount must be positive");

    const account = await repo.findAccountById(data.accountId);
    if (!account)
      throw new AccountNotFoundError(`account ${data.accountId} not found`);

    // Use transaction pattern at repo level if implemented; here we assume repo methods are atomic or the repo handles tx.
    const entry = await repo.insertEntry({
      organizationId: data.organizationId,
      accountId: data.accountId,
      type: "purchase",
      direction: "credit",
      points: data.amount,
      amountCents: null,
      occurredAt: data.occurredAt ?? new Date(),
      description: data.description,
      source: data.source,
      status: "posted",
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const lot = await repo.insertLot({
      organizationId: data.organizationId,
      accountId: data.accountId,
      sourceEntryId: entry.id,
      acquiredPoints: data.amount,
      remainingPoints: data.amount,
      issuedAt: data.occurredAt ?? new Date(),
      expiresAt: data.expiresAt ?? null,
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata,
    });

    await repo.updateProgramAccountBalance(data.accountId, data.amount);

    return {
      entryId: entry.id,
      lotId: lot.id,
      acquiredPoints: data.amount,
      remainingPoints: data.amount,
    };
  }

  async function getAvailableMilesBalance(accountId: number) {
    const lots = await repo.getAvailableLots(accountId);
    const availablePoints = lots.reduce((s, l) => s + l.remainingPoints, 0);
    return { accountId, availablePoints };
  }

  async function consumeMiles(
    input: ConsumeMilesInput,
  ): Promise<ConsumeMilesResult> {
    const data = consumeMilesInputSchema.parse(input);

    if (data.amount <= 0)
      throw new InvalidMovementAmountError("amount must be positive");

    const account = await repo.findAccountById(data.accountId);
    if (!account)
      throw new AccountNotFoundError(`account ${data.accountId} not found`);

    // Fetch available lots (expected sorted FIFO: oldest first)
    const lots = await repo.getAvailableLots(data.accountId);
    const totalAvailable = lots.reduce((s, l) => s + l.remainingPoints, 0);
    if (totalAvailable < data.amount)
      throw new InsufficientMilesError("insufficient points");

    let toConsume = data.amount;
    const consumedLots: ConsumedLot[] = [];

    for (const lot of lots) {
      if (toConsume <= 0) break;
      const take = Math.min(lot.remainingPoints, toConsume);
      const newRemaining = lot.remainingPoints - take;
      await repo.updateLotRemaining(lot.id, newRemaining);
      consumedLots.push({
        lotId: lot.id,
        consumedPoints: take,
        remainingPointsAfterConsumption: newRemaining,
      });
      toConsume -= take;
    }

    // Create a single entry representing the consumption
    const entry = await repo.insertEntry({
      organizationId: data.organizationId,
      accountId: data.accountId,
      type: "consumption",
      direction: "debit",
      points: data.amount,
      occurredAt: data.occurredAt ?? new Date(),
      description: data.description,
      status: "posted",
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Decrease program account balance
    await repo.updateProgramAccountBalance(data.accountId, -data.amount);

    return {
      movementId: entry.id,
      accountId: data.accountId,
      consumedPoints: data.amount,
      consumedLots,
    };
  }

  async function transferMiles(input: TransferMilesInput) {
    const data = transferMilesInputSchema.parse(input);

    // For now: consume from source and create transfer record; creation of lot on destination is pending design
    const consumed = await consumeMiles({
      accountId: data.fromAccountId,
      amount: data.amount,
      occurredAt: data.occurredAt,
      description: data.description,
      metadata: data.metadata,
    });

    const transferRecord = repo.insertTransfer
      ? await repo.insertTransfer({
          organizationId: data.organizationId,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId ?? null,
          pointsSent: data.amount,
          pointsReceived: data.amount,
          transferredAt: data.occurredAt ?? new Date(),
          status: "posted",
          description: data.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : { id: -1 };

    return {
      transferId: transferRecord.id,
      consumed,
    };
  }

  return {
    acquireMiles,
    getAvailableMilesBalance,
    consumeMiles,
    transferMiles,
  } as const;
}

export type MovementService = ReturnType<typeof createMovementService>;

export default createMovementService;
