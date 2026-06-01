-- Migration: 0004_campaign_catalog_engine.sql
-- Adds the campaign catalog engine schema, enums and snapshot table

BEGIN;

DO $$
BEGIN
  CREATE TYPE campaign_type AS ENUM (
    'POINTS_PER_REAL',
    'POINTS_PER_DOLLAR',
    'FIXED_POINTS',
    'CASHBACK'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE campaign_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS program_slug varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS program_name varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS partner_slug varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS partner_name varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS logo_url varchar(1024);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_title varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_url varchar(1024);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS country_code varchar(10);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_type campaign_type;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS points_per_real integer;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS points_per_dollar integer;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS minimum_purchase_amount integer;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS coupon_code varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS requires_club boolean NOT NULL DEFAULT false;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS credit_deadline_days integer;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_start_date timestamp;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_end_date timestamp;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS scraped_at timestamp;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS last_verified_at timestamp;
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS campaign_status campaign_status NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS source_type varchar(100);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS source_name varchar(255);
ALTER TABLE partner_campaigns ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

UPDATE partner_campaigns pc
SET
  program_slug = COALESCE(program_slug, (SELECT lp.slug FROM loyalty_programs lp WHERE lp.id = pc.program_id LIMIT 1)),
  program_name = COALESCE(program_name, (SELECT lp.name FROM loyalty_programs lp WHERE lp.id = pc.program_id LIMIT 1)),
  partner_slug = COALESCE(partner_slug, (SELECT ps.slug FROM partner_stores ps WHERE ps.id = pc.partner_store_id LIMIT 1)),
  partner_name = COALESCE(partner_name, (SELECT ps.name FROM partner_stores ps WHERE ps.id = pc.partner_store_id LIMIT 1)),
  logo_url = COALESCE(logo_url, (SELECT ps.logo_url FROM partner_stores ps WHERE ps.id = pc.partner_store_id LIMIT 1)),
  campaign_title = COALESCE(campaign_title, title),
  campaign_url = COALESCE(campaign_url, source_url),
  country_code = COALESCE(country_code, 'BR'),
  campaign_type = COALESCE(campaign_type, CASE WHEN multiplier_type = 'points_per_dollar' THEN 'POINTS_PER_DOLLAR'::campaign_type ELSE 'POINTS_PER_REAL'::campaign_type END),
  points_per_real = COALESCE(points_per_real, CASE WHEN multiplier_type = 'points_per_real' THEN multiplier ELSE NULL END),
  points_per_dollar = COALESCE(points_per_dollar, CASE WHEN multiplier_type = 'points_per_dollar' THEN multiplier ELSE NULL END),
  minimum_purchase_amount = COALESCE(minimum_purchase_amount, 0),
  requires_club = COALESCE(requires_club, false),
  credit_deadline_days = COALESCE(credit_deadline_days, 0),
  campaign_start_date = COALESCE(campaign_start_date, starts_at),
  campaign_end_date = COALESCE(campaign_end_date, ends_at),
  scraped_at = COALESCE(scraped_at, observed_at),
  last_verified_at = COALESCE(last_verified_at, observed_at),
  campaign_status = COALESCE(campaign_status, CASE WHEN is_active THEN 'ACTIVE'::campaign_status ELSE 'SUSPENDED'::campaign_status END),
  source_type = COALESCE(source_type, 'seed'),
  source_name = COALESCE(source_name, 'db/seed/campaigns-seed.ts'),
  is_featured = COALESCE(is_featured, false);

CREATE INDEX IF NOT EXISTS idx_partner_campaigns_org_partner_slug ON partner_campaigns (organization_id, partner_slug);
CREATE INDEX IF NOT EXISTS idx_partner_campaigns_org_program_slug ON partner_campaigns (organization_id, program_slug);
CREATE INDEX IF NOT EXISTS idx_partner_campaigns_org_status ON partner_campaigns (organization_id, campaign_status);
CREATE INDEX IF NOT EXISTS idx_partner_campaigns_featured ON partner_campaigns (organization_id, is_featured);

CREATE TABLE IF NOT EXISTS campaign_snapshots (
  id serial PRIMARY KEY,
  campaign_id integer NOT NULL,
  points_per_real integer,
  campaign_status campaign_status NOT NULL DEFAULT 'UNKNOWN',
  captured_at timestamp NOT NULL DEFAULT NOW(),
  raw_payload json NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_snapshots_campaign ON campaign_snapshots (campaign_id, captured_at);

COMMIT;
