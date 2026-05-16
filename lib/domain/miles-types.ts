export type MileOperationType =
  | "initial_balance"
  | "credit"
  | "debit"
  | "purchase"
  | "sale"
  | "transfer_out"
  | "transfer_in"
  | "club_credit"
  | "adjustment";

export type MileProgramType =
  | "airline"
  | "bank"
  | "hotel"
  | "cashback"
  | "other";

export type MileEntryDirection = "in" | "out";

export type PendingPurchaseStatus = "pending" | "received" | "cancelled";

export type SaleStatus = "draft" | "confirmed" | "cancelled";

export type TransferStatus = "draft" | "confirmed" | "cancelled";

export interface DomainBase {
  organizationId: number | string;
  createdByUserId?: number | string;
}

export interface MileEntryBase extends DomainBase {
  id?: number | string;
  type: MileOperationType;
  direction: MileEntryDirection;
  points: number;
  moneyAmountCents?: number;
  costPerThousandCents?: number;
  occurredAt?: string | Date;
  description?: string;
  metadata?: Record<string, unknown> | null;
}
