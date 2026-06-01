import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Minimal tables expected by @better-auth/drizzle-adapter.
// The adapter resolves logical model names from named exports, while the
// physical tables remain the existing ba_* relations.

export const user = pgTable("ba_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("ba_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const account = pgTable("ba_accounts", {
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

export const verification = pgTable("ba_verification", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  identifier: text("identifier").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ba_users = user;
export const ba_sessions = session;
export const ba_accounts = account;
export const ba_verification = verification;

// Export a schema object with the logical model names expected by the adapter.
// Keep the historical ba_* aliases above for compatibility elsewhere.
const betterAuthSchema = {
  user,
  session,
  account,
  verification,
};

export default betterAuthSchema;
