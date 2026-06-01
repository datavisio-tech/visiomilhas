CREATE TABLE "ba_users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "name" text NOT NULL,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_users_email_unique" ON "ba_users" ("email");
--> statement-breakpoint
CREATE TABLE "ba_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_sessions_token_unique" ON "ba_sessions" ("token");
--> statement-breakpoint
CREATE INDEX "ba_sessions_user_id_idx" ON "ba_sessions" ("user_id");
--> statement-breakpoint
CREATE TABLE "ba_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "provider_id" text NOT NULL,
  "account_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_accounts_provider_account_unique" ON "ba_accounts" ("provider_id", "account_id");
--> statement-breakpoint
CREATE INDEX "ba_accounts_user_id_idx" ON "ba_accounts" ("user_id");
--> statement-breakpoint
CREATE TABLE "ba_verification" (
  "id" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "identifier" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
