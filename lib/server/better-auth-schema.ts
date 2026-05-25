import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// Minimal tables expected by @better-auth/drizzle-adapter.
// These definitions are intentionally minimal and only provide the model
// shapes required at runtime to avoid adapter schema lookup errors.

export const ba_users = pgTable("ba_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at"),
});

export const ba_sessions = pgTable("ba_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at"),
});

export const ba_accounts = pgTable("ba_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: varchar("provider", { length: 255 }),
  providerAccountId: varchar("provider_account_id", { length: 255 }),
});

export const ba_verification = pgTable("ba_verification", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at"),
  identifier: varchar("identifier", { length: 255 }),
});

// Export a schema object mapping model names to the table objects. The
// adapter will look for keys such as `verification`, `users`, `sessions`.
// We map them to our minimal table names to satisfy the adapter's checks.
const betterAuthSchema = {
  users: ba_users,
  sessions: ba_sessions,
  accounts: ba_accounts,
  verification: ba_verification,
};

export default betterAuthSchema;
