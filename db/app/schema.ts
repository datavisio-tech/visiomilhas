import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  json,
  boolean,
} from "drizzle-orm/pg-core";

export const loyalty_programs = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  country: varchar("country", { length: 100 }),
  currencyLabel: varchar("currency_label", { length: 20 }),
  color: varchar("color", { length: 20 }),
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const program_accounts = pgTable("program_accounts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id").notNull(),
  nickname: varchar("nickname", { length: 255 }),
  holderName: varchar("holder_name", { length: 255 }),
  documentLabel: varchar("document_label", { length: 255 }),
  currentPointsBalance: integer("current_points_balance").notNull().default(0),
  currentCostBasisCents: integer("current_cost_basis_cents")
    .notNull()
    .default(0),
  currentAverageCostPerThousandCents: integer(
    "current_avg_cost_per_thousand_cents",
  )
    .notNull()
    .default(0),
  beneficiaryLimit: integer("beneficiary_limit"),
  beneficiaryUsedCount: integer("beneficiary_used_count").notNull().default(0),
  beneficiaryWindowMonths: integer("beneficiary_window_months"),
  status: varchar("status", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const mile_entries = pgTable("mile_entries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  type: varchar("type", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  direction: varchar("direction", { length: 20 }).notNull(),
  points: integer("points").notNull(),
  amountCents: integer("amount_cents"),
  costBasisCents: integer("cost_basis_cents"),
  costPerThousandCents: integer("cost_per_thousand_cents"),
  occurredAt: timestamp("occurred_at").notNull(),
  description: text("description"),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: varchar("related_entity_id", { length: 255 }),
  metadata: json("metadata"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  reversedAt: timestamp("reversed_at"),
  reversalOfEntryId: integer("reversal_of_entry_id"),
  consumedLotId: integer("consumed_lot_id"),
  consumedPoints: integer("consumed_points"),
  lotSnapshot: json("lot_snapshot"),
});

export const mile_purchases = pgTable("mile_purchases", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  points: integer("points").notNull(),
  amountCents: integer("amount_cents"),
  feesCents: integer("fees_cents"),
  discountCents: integer("discount_cents"),
  totalCostCents: integer("total_cost_cents"),
  costPerThousandCents: integer("cost_per_thousand_cents"),
  purchasedAt: timestamp("purchased_at"),
  expectedCreditAt: timestamp("expected_credit_at"),
  receivedAt: timestamp("received_at"),
  status: varchar("status", { length: 50 }).notNull(),
  description: text("description"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const mile_point_lots = pgTable("mile_point_lots", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  sourceEntryId: integer("source_entry_id"),
  acquiredPoints: integer("acquired_points").notNull(),
  remainingPoints: integer("remaining_points").notNull().default(0),
  totalCostCents: integer("total_cost_cents"),
  costPerThousandCents: integer("cost_per_thousand_cents"),
  issuedAt: timestamp("issued_at").notNull(),
  expiresAt: timestamp("expires_at"),
  status: varchar("status", { length: 50 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/*
  Nota: constraints (FKs), índices e checks propostos para `mile_point_lots`
  estão descritos em `db/app/migrations/0001_add_mile_point_lots.sql`.
  Drizzle schema mantém as definições de coluna e tipos tipados aqui.
  A aplicação das constraints/índices fica a cargo das migrations SQL
  (seguindo o padrão do repositório de manter constraints em migrations).
*/

export const mile_sales = pgTable("mile_sales", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  customerName: varchar("customer_name", { length: 255 }),
  points: integer("points").notNull(),
  revenueCents: integer("revenue_cents"),
  costBasisCents: integer("cost_basis_cents"),
  profitCents: integer("profit_cents"),
  marginPercentage: integer("margin_percentage"),
  soldAt: timestamp("sold_at"),
  status: varchar("status", { length: 50 }).notNull(),
  description: text("description"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const mile_transfers = pgTable("mile_transfers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  fromProgramId: integer("from_program_id"),
  fromAccountId: integer("from_account_id"),
  toProgramId: integer("to_program_id"),
  toAccountId: integer("to_account_id"),
  pointsSent: integer("points_sent").notNull(),
  bonusPercentage: integer("bonus_percentage"),
  bonusPoints: integer("bonus_points"),
  pointsReceived: integer("points_received"),
  transferFeeCents: integer("transfer_fee_cents"),
  transferredCostBasisCents: integer("transferred_cost_basis_cents"),
  destinationCostPerThousandCents: integer(
    "destination_cost_per_thousand_cents",
  ),
  transferredAt: timestamp("transferred_at"),
  sourceEntryId: integer("source_entry_id"),
  destinationEntryId: integer("destination_entry_id"),
  status: varchar("status", { length: 50 }).notNull(),
  description: text("description"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const mile_clubs = pgTable("mile_clubs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  name: varchar("name", { length: 255 }).notNull(),
  monthlyAmountCents: integer("monthly_amount_cents"),
  baseMonthlyPoints: integer("base_monthly_points"),
  bonusMonthlyPoints: integer("bonus_monthly_points"),
  billingDay: integer("billing_day"),
  expectedCreditDay: integer("expected_credit_day"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 50 }).notNull(),
  metadata: json("metadata"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const beneficiaries = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  programId: integer("program_id"),
  accountId: integer("account_id"),
  name: varchar("name", { length: 255 }).notNull(),
  documentMasked: varchar("document_masked", { length: 255 }),
  relationship: varchar("relationship", { length: 100 }),
  addedAt: timestamp("added_at"),
  removedAt: timestamp("removed_at"),
  status: varchar("status", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const business_contacts = pgTable("business_contacts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  documentMasked: varchar("document_masked", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
