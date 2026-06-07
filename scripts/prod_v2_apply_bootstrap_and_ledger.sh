#!/usr/bin/env bash
# Operational script to apply PROD V2 bootstrap and ledger migrations.
# Behavior:
# - Fail-fast by default (exit on any error).
# - Optional automatic rollback/restore if `AUTO_RESTORE=true` is set in the environment.
# - Validates presence of required tables after bootstrap and ledger migrations.
# - Uses absolute paths relative to this script's directory for migration files.

set -o errexit
set -o pipefail
# allow optional vars to be unset when referenced explicitly with defaults

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG0="$DIR/../db/app/migrations/0000_misty_kulan_gath.sql"
MIG1="$DIR/../db/app/migrations/0001_add_mile_point_lots.sql"

# AUTO_RESTORE: when true, script will attempt to restore the pre-migration dump on failure.
# Default is 'false' -> fail-fast behavior.
AUTO_RESTORE=${AUTO_RESTORE:-false}

if [ -z "${APP_DATABASE_URL:-}" ]; then
  echo "ERROR: APP_DATABASE_URL is not set. Aborting." >&2
  exit 2
fi

if [ ! -f "$MIG0" ]; then
  echo "ERROR: migration file not found: $MIG0" >&2
  exit 3
fi
if [ ! -f "$MIG1" ]; then
  echo "ERROR: migration file not found: $MIG1" >&2
  exit 3
fi

PRE_DUMP_FILE=""
on_err() {
  rc=$?
  lineno=${BASH_LINENO[0]:-?}
  echo "ERROR: script failed at line ${lineno} (rc=${rc})" >&2
  if [ "${AUTO_RESTORE}" = "true" ] && [ -n "$PRE_DUMP_FILE" ] && [ -f "$PRE_DUMP_FILE" ]; then
    echo "AUTO_RESTORE is enabled — attempting pg_restore from $PRE_DUMP_FILE" >&2
    pg_restore --no-owner --dbname="$APP_DATABASE_URL" "$PRE_DUMP_FILE" || echo "pg_restore failed" >&2
  else
    echo "Fail-fast: not attempting automatic restore. To enable automatic restore set AUTO_RESTORE=true" >&2
  fi
  exit $rc
}
trap on_err ERR

echo "[*] PRECHECK: checking current database"
current_db=$(psql --no-password --dbname="$APP_DATABASE_URL" -t -A -c "SELECT current_database()")
echo "[*] connected to: $current_db"

echo "[*] Creating pre-migration dump (pg_dump -Fc)"
PRE_DUMP_FILE=$(mktemp /tmp/prod_v2_pre_migration.XXXXXX.dump)
pg_dump --format=custom --file="$PRE_DUMP_FILE" --dbname="$APP_DATABASE_URL"
echo "[*] Pre-migration dump saved to $PRE_DUMP_FILE"

echo "[*] Applying bootstrap migration: $MIG0"
psql --no-password --dbname="$APP_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIG0"

echo "[*] Validating bootstrap tables"
required_tables=(
  loyalty_programs
  program_accounts
  mile_entries
  mile_purchases
  mile_sales
  mile_transfers
  mile_clubs
  beneficiaries
  business_contacts
  partner_stores
  partner_campaigns
  campaign_snapshots
  purchase_records
  purchase_status_history
  purchase_evidences
)

echo "[*] Running consolidated table existence check"
read -r -d '' values_sql <<'SQL' || true
SELECT t.table_name, EXISTS(
  SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t.table_name
) AS present
FROM (VALUES
  ('loyalty_programs'),
  ('program_accounts'),
  ('mile_entries'),
  ('mile_purchases'),
  ('mile_sales'),
  ('mile_transfers'),
  ('mile_clubs'),
  ('beneficiaries'),
  ('business_contacts'),
  ('partner_stores'),
  ('partner_campaigns'),
  ('campaign_snapshots'),
  ('purchase_records'),
  ('purchase_status_history'),
  ('purchase_evidences')
) AS t(table_name);
SQL

missing_bootstrap=()
while IFS='|' read -r tbl present; do
  tbl=$(echo "$tbl" | xargs)
  present=$(echo "$present" | xargs)
  if [ "$present" != "t" ] && [ "$present" != "true" ]; then
    missing_bootstrap+=("$tbl")
  fi
done < <(psql --no-password --dbname="$APP_DATABASE_URL" -t -A -F'|' -c "$values_sql")

if [ ${#missing_bootstrap[@]} -ne 0 ]; then
  echo "ERROR: Missing bootstrap tables: ${missing_bootstrap[*]}" >&2
  exit 5
fi

echo "[*] Applying ledger migration: $MIG1"
psql --no-password --dbname="$APP_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIG1"

echo "[*] Validating ledger artifacts (mile_point_lots and expected indices)"
ledger_checks_sql="SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mile_point_lots') AS mpl_present;"
mpl_present=$(psql --no-password --dbname="$APP_DATABASE_URL" -t -A -c "$ledger_checks_sql")
if [ "$mpl_present" != "t" ] && [ "$mpl_present" != "true" ]; then
  echo "ERROR: mile_point_lots table missing after applying 0001." >&2
  exit 6
fi

echo "[*] Checking expected indices"
expected_indices=(
  idx_mpl_account_remaining
  idx_mpl_source_entry
  idx_me_account_occurred
  idx_mt_source_dest
)
missing_idx=()
for ix in "${expected_indices[@]}"; do
  exists=$(psql --no-password --dbname="$APP_DATABASE_URL" -t -A -c "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname='$ix')")
  if [ "$exists" != "t" ] && [ "$exists" != "true" ]; then
    missing_idx+=("$ix")
  fi
done
if [ ${#missing_idx[@]} -ne 0 ]; then
  echo "ERROR: Missing expected indices: ${missing_idx[*]}" >&2
  exit 7
fi

echo "[*] Migrations applied and validated successfully. Leaving pre-migration dump at $PRE_DUMP_FILE"
echo "To rollback manually: pg_restore --no-owner --dbname=\"$APP_DATABASE_URL\" $PRE_DUMP_FILE"

exit 0
