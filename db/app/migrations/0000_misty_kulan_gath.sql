CREATE TABLE "beneficiaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer,
	"account_id" integer,
	"name" varchar(255) NOT NULL,
	"document_masked" varchar(255),
	"relationship" varchar(100),
	"added_at" timestamp,
	"removed_at" timestamp,
	"status" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"document_masked" varchar(255),
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"country" varchar(100),
	"currency_label" varchar(20),
	"color" varchar(20),
	"is_system_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" json,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mile_clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer,
	"account_id" integer,
	"name" varchar(255) NOT NULL,
	"monthly_amount_cents" integer,
	"base_monthly_points" integer,
	"bonus_monthly_points" integer,
	"billing_day" integer,
	"expected_credit_day" integer,
	"started_at" timestamp,
	"ended_at" timestamp,
	"status" varchar(50) NOT NULL,
	"metadata" json,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mile_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer,
	"account_id" integer,
	"type" varchar(100) NOT NULL,
	"category" varchar(100),
	"direction" varchar(20) NOT NULL,
	"points" integer NOT NULL,
	"amount_cents" integer,
	"cost_basis_cents" integer,
	"cost_per_thousand_cents" integer,
	"occurred_at" timestamp NOT NULL,
	"description" text,
	"source" varchar(100),
	"status" varchar(50) NOT NULL,
	"related_entity_type" varchar(100),
	"related_entity_id" varchar(255),
	"metadata" json,
	"created_by_user_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"reversed_at" timestamp,
	"reversal_of_entry_id" integer
);
--> statement-breakpoint
CREATE TABLE "mile_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer,
	"account_id" integer,
	"points" integer NOT NULL,
	"amount_cents" integer,
	"fees_cents" integer,
	"discount_cents" integer,
	"total_cost_cents" integer,
	"cost_per_thousand_cents" integer,
	"purchased_at" timestamp,
	"expected_credit_at" timestamp,
	"received_at" timestamp,
	"status" varchar(50) NOT NULL,
	"description" text,
	"created_by_user_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mile_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer,
	"account_id" integer,
	"customer_name" varchar(255),
	"points" integer NOT NULL,
	"revenue_cents" integer,
	"cost_basis_cents" integer,
	"profit_cents" integer,
	"margin_percentage" integer,
	"sold_at" timestamp,
	"status" varchar(50) NOT NULL,
	"description" text,
	"created_by_user_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mile_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"from_program_id" integer,
	"from_account_id" integer,
	"to_program_id" integer,
	"to_account_id" integer,
	"points_sent" integer NOT NULL,
	"bonus_percentage" integer,
	"bonus_points" integer,
	"points_received" integer,
	"transfer_fee_cents" integer,
	"transferred_cost_basis_cents" integer,
	"destination_cost_per_thousand_cents" integer,
	"transferred_at" timestamp,
	"status" varchar(50) NOT NULL,
	"description" text,
	"created_by_user_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"nickname" varchar(255),
	"holder_name" varchar(255),
	"document_label" varchar(255),
	"current_points_balance" integer DEFAULT 0 NOT NULL,
	"current_cost_basis_cents" integer DEFAULT 0 NOT NULL,
	"current_avg_cost_per_thousand_cents" integer DEFAULT 0 NOT NULL,
	"beneficiary_limit" integer,
	"beneficiary_used_count" integer DEFAULT 0 NOT NULL,
	"beneficiary_window_months" integer,
	"status" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
