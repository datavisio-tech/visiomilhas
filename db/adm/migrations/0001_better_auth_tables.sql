CREATE TABLE "ba_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_users_email_unique" ON "ba_users" USING btree ("email");
--> statement-breakpoint
CREATE TABLE "ba_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_sessions_token_unique" ON "ba_sessions" USING btree ("token");
--> statement-breakpoint
ALTER TABLE "ba_sessions" ADD CONSTRAINT "ba_sessions_user_id_ba_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_users"("id") ON DELETE cascade ON UPDATE no action;
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
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_accounts_provider_account_unique" ON "ba_accounts" USING btree ("provider_id","account_id");
--> statement-breakpoint
ALTER TABLE "ba_accounts" ADD CONSTRAINT "ba_accounts_user_id_ba_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "ba_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"identifier" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_verification_identifier_value_unique" ON "ba_verification" USING btree ("identifier","value");
