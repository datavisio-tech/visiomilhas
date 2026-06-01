-- Migration: 0002_purchases_tracking.sql
-- Adds partner stores, partner campaigns and purchases tracking tables

BEGIN;

CREATE TABLE IF NOT EXISTS partner_stores (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  slug varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  logo_url varchar(1024),
  website_url varchar(1024),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_stores_org_slug ON partner_stores (organization_id, slug);

CREATE TABLE IF NOT EXISTS partner_campaigns (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  partner_store_id integer,
  program_id integer,
  title varchar(255) NOT NULL,
  multiplier integer NOT NULL DEFAULT 0,
  multiplier_type varchar(50) NOT NULL DEFAULT 'points_per_real',
  starts_at timestamp,
  ends_at timestamp,
  source_url varchar(1024),
  observed_at timestamp,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_campaigns_partner ON partner_campaigns (organization_id, partner_store_id);

CREATE TABLE IF NOT EXISTS purchase_records (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  account_id integer,
  program_id integer,
  partner_store_id integer,
  partner_campaign_id integer,
  title varchar(255),
  order_number varchar(255),
  purchase_date timestamp,
  purchase_amount_cents integer,
  freight_cents integer,
  other_costs_cents integer,
  expected_points integer,
  credited_points integer,
  multiplier integer,
  status varchar(50) NOT NULL DEFAULT 'PENDING',
  expected_credit_date timestamp,
  credited_at timestamp,
  notes text,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_records_account ON purchase_records (organization_id, account_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_partner ON purchase_records (organization_id, partner_store_id);

CREATE TABLE IF NOT EXISTS purchase_status_history (
  id serial PRIMARY KEY,
  purchase_id integer NOT NULL,
  old_status varchar(50),
  new_status varchar(50) NOT NULL,
  notes text,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_evidences (
  id serial PRIMARY KEY,
  purchase_id integer NOT NULL,
  file_name varchar(1024),
  file_type varchar(255),
  file_url varchar(2048),
  uploaded_at timestamp
);

COMMIT;
