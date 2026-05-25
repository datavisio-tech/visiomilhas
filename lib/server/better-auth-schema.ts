import {
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// Minimal tables expected by @better-auth/drizzle-adapter.
// These definitions are intentionally minimal and only provide the model
// shapes required at runtime to avoid adapter schema lookup errors.

export const ba_users = pgTable("ba_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ba_sessions = pgTable("ba_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ba_accounts = pgTable("ba_accounts", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ba_verification = pgTable("ba_verification", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  identifier: text("identifier").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
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
