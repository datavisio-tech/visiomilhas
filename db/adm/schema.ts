import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  json,
} from "drizzle-orm/pg-core";

export const global_users = pgTable("global_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  ownerUserId: integer("owner_user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const organization_memberships = pgTable("organization_memberships", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  billingInterval: varchar("billing_interval", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  trialStartsAt: timestamp("trial_starts_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const billing_events = pgTable("billing_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  providerEventId: varchar("provider_event_id", { length: 255 }),
  payload: json("payload"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull(),
});

export const admin_audit_logs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id"),
  userId: integer("user_id"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 255 }),
  entityId: varchar("entity_id", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull(),
});
