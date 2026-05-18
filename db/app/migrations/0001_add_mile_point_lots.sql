-- Migration proposta: adicionar tabela mile_point_lots e colunas auxiliares
-- NÃO APLICAR automaticamente. Arquivo gerado para revisão e commit apenas.

BEGIN;

CREATE TABLE IF NOT EXISTS public.mile_point_lots (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  program_id integer,
  account_id integer NOT NULL,
  source_entry_id integer,
  acquired_points integer NOT NULL,
  remaining_points integer NOT NULL DEFAULT 0,
  total_cost_cents integer,
  cost_per_thousand_cents integer,
  issued_at timestamp NOT NULL,
  expires_at timestamp,
  status varchar(50) NOT NULL,
  metadata json,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
);

-- Colunas auxiliares em mile_entries
ALTER TABLE IF EXISTS public.mile_entries
  ADD COLUMN IF NOT EXISTS consumed_lot_id integer,
  ADD COLUMN IF NOT EXISTS consumed_points integer,
  ADD COLUMN IF NOT EXISTS lot_snapshot json;

-- Colunas auxiliares em mile_transfers
ALTER TABLE IF EXISTS public.mile_transfers
  ADD COLUMN IF NOT EXISTS source_entry_id integer,
  ADD COLUMN IF NOT EXISTS destination_entry_id integer;

-- Índices sugeridos
CREATE INDEX IF NOT EXISTS idx_mpl_account_remaining ON public.mile_point_lots (account_id, remaining_points DESC, expires_at ASC);
CREATE INDEX IF NOT EXISTS idx_mpl_source_entry ON public.mile_point_lots (source_entry_id);
CREATE INDEX IF NOT EXISTS idx_me_account_occurred ON public.mile_entries (account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mt_source_dest ON public.mile_transfers (from_account_id, to_account_id);

COMMIT;

-- Constraints and checks (proposed). Review before applying in a live DB.

BEGIN;

-- Foreign keys
ALTER TABLE IF EXISTS public.mile_point_lots
  ADD CONSTRAINT fk_mpl_account FOREIGN KEY (account_id) REFERENCES public.program_accounts(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.mile_point_lots
  ADD CONSTRAINT fk_mpl_source_entry FOREIGN KEY (source_entry_id) REFERENCES public.mile_entries(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.mile_entries
  ADD CONSTRAINT fk_me_account FOREIGN KEY (account_id) REFERENCES public.program_accounts(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.mile_transfers
  ADD CONSTRAINT fk_mt_from_account FOREIGN KEY (from_account_id) REFERENCES public.program_accounts(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.mile_transfers
  ADD CONSTRAINT fk_mt_to_account FOREIGN KEY (to_account_id) REFERENCES public.program_accounts(id) ON DELETE RESTRICT;

-- Checks
ALTER TABLE IF EXISTS public.mile_point_lots
  ADD CONSTRAINT chk_mpl_acquired_positive CHECK (acquired_points > 0),
  ADD CONSTRAINT chk_mpl_remaining_nonnegative CHECK (remaining_points >= 0),
  ADD CONSTRAINT chk_mpl_remaining_le_acquired CHECK (remaining_points <= acquired_points);

ALTER TABLE IF EXISTS public.mile_entries
  ADD CONSTRAINT chk_me_points_nonzero CHECK (points <> 0);

ALTER TABLE IF EXISTS public.mile_transfers
  ADD CONSTRAINT chk_mt_points_positive CHECK (points_sent > 0 OR points_received > 0);

COMMIT;
