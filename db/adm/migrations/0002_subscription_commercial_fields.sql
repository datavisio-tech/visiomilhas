ALTER TABLE "subscriptions"
  ADD COLUMN "trial_started_at" timestamp,
  ADD COLUMN "trial_expires_at" timestamp,
  ADD COLUMN "activated_at" timestamp,
  ADD COLUMN "access_state" varchar(50),
  ADD COLUMN "plan_type" varchar(50),
  ADD COLUMN "tenant_state" varchar(50);
