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
MIG0_HOSTPATH="$DIR/../db/app/migrations/0000_misty_kulan_gath.sql"
MIG1_HOSTPATH="$DIR/../db/app/migrations/0001_add_mile_point_lots.sql"
MIG0_CONTAINER_PATH="/tmp/0000_misty_kulan_gath.sql"
MIG1_CONTAINER_PATH="/tmp/0001_add_mile_point_lots.sql"

# Default env file path where APP_DATABASE_URL is expected to be defined on the host
ENV_FILE=${ENV_FILE:-/opt/datavisio/visiomilhas-clean/.env.production}
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  APP_DATABASE_URL=$(grep -E '^APP_DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2-)
  APP_DATABASE_URL=${APP_DATABASE_URL#\"}
  APP_DATABASE_URL=${APP_DATABASE_URL%\"}
  export APP_DATABASE_URL
fi

# AUTO_RESTORE: when true, script will attempt to restore the pre-migration dump on failure.
# Default is 'false' -> fail-fast behavior.
AUTO_RESTORE=${AUTO_RESTORE:-false}

if [ -z "${APP_DATABASE_URL:-}" ]; then
  echo "ERROR: APP_DATABASE_URL is not set (check $ENV_FILE). Aborting." >&2
  exit 2
fi

if [ ! -f "$MIG0_HOSTPATH" ]; then
  echo "ERROR: migration file not found on host: $MIG0_HOSTPATH" >&2
  exit 3
fi
if [ ! -f "$MIG1_HOSTPATH" ]; then
  echo "ERROR: migration file not found on host: $MIG1_HOSTPATH" >&2
  exit 3
fi

# Ensure docker and target container exist
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker CLI not available on host. Aborting." >&2
  exit 4
fi
if ! docker inspect postgres_prod_v2 >/dev/null 2>&1; then
  echo "ERROR: container 'postgres_prod_v2' not found or not running. Aborting." >&2
  exit 4
fi

PRE_DUMP_FILE=""
on_err() {
  rc=$?
  lineno=${BASH_LINENO[0]:-?}
  echo "ERROR: script failed at line ${lineno} (rc=${rc})" >&2
  if [ "${AUTO_RESTORE}" = "true" ]; then
    echo "AUTO_RESTORE is enabled — attempting restore inside container postgres_prod_v2" >&2
    if [ -n "${PRE_DUMP_CONTAINER_PATH:-}" ]; then
      docker exec postgres_prod_v2 pg_restore --no-owner --dbname="$APP_DATABASE_URL" "$PRE_DUMP_CONTAINER_PATH" || echo "pg_restore (container) failed" >&2
    elif [ -n "$PRE_DUMP_FILE" ] && [ -f "$PRE_DUMP_FILE" ]; then
      # copy host dump into container then restore
      docker cp "$PRE_DUMP_FILE" postgres_prod_v2:/tmp/$(basename "$PRE_DUMP_FILE")
      docker exec postgres_prod_v2 pg_restore --no-owner --dbname="$APP_DATABASE_URL" /tmp/$(basename "$PRE_DUMP_FILE") || echo "pg_restore (copied) failed" >&2
    else
      echo "AUTO_RESTORE requested but no dump available" >&2
    fi
  else
    echo "Fail-fast: not attempting automatic restore. To enable automatic restore set AUTO_RESTORE=true" >&2
  fi
  exit $rc
}
trap on_err ERR

echo "[*] PRECHECK: checking current database"
current_db=$(docker exec postgres_prod_v2 psql --tuples-only --no-align --dbname="$APP_DATABASE_URL" -c "SELECT current_database()")
echo "[*] connected to: $current_db"

echo "[*] Creating pre-migration dump inside container postgres_prod_v2 (pg_dump -Fc)"
PRE_DUMP_CONTAINER_PATH="/tmp/prod_v2_pre_migration.$(date +%s).dump"
docker exec postgres_prod_v2 pg_dump --format=custom --file="$PRE_DUMP_CONTAINER_PATH" --dbname="$APP_DATABASE_URL"
echo "[*] Pre-migration dump saved inside container at $PRE_DUMP_CONTAINER_PATH"

# Optionally copy dump to host for safekeeping
PRE_DUMP_FILE_HOST=$(mktemp /tmp/prod_v2_pre_migration.XXXXXX.dump)
docker cp postgres_prod_v2:"$PRE_DUMP_CONTAINER_PATH" "$PRE_DUMP_FILE_HOST"
echo "[*] Pre-migration dump copied to host: $PRE_DUMP_FILE_HOST"
PRE_DUMP_FILE="$PRE_DUMP_FILE_HOST"

echo "[*] Copying bootstrap migration into container and applying: $MIG0_HOSTPATH -> $MIG0_CONTAINER_PATH"
docker cp "$MIG0_HOSTPATH" postgres_prod_v2:"$MIG0_CONTAINER_PATH"
docker exec postgres_prod_v2 psql --set ON_ERROR_STOP=1 --dbname="$APP_DATABASE_URL" -f "$MIG0_CONTAINER_PATH"

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
done < <(docker exec postgres_prod_v2 psql --tuples-only --no-align --field-separator='|' --dbname="$APP_DATABASE_URL" -c "$values_sql")

if [ ${#missing_bootstrap[@]} -ne 0 ]; then
  echo "ERROR: Missing bootstrap tables: ${missing_bootstrap[*]}" >&2
  exit 5
fi

echo "[*] Copying ledger migration into container and applying: $MIG1_HOSTPATH -> $MIG1_CONTAINER_PATH"
docker cp "$MIG1_HOSTPATH" postgres_prod_v2:"$MIG1_CONTAINER_PATH"
docker exec postgres_prod_v2 psql --set ON_ERROR_STOP=1 --dbname="$APP_DATABASE_URL" -f "$MIG1_CONTAINER_PATH"

echo "[*] Validating ledger artifacts (mile_point_lots and expected indices)"
ledger_checks_sql="SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mile_point_lots') AS mpl_present;"
mpl_present=$(docker exec postgres_prod_v2 psql --tuples-only --no-align --dbname="$APP_DATABASE_URL" -c "$ledger_checks_sql")
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
  exists=$(docker exec postgres_prod_v2 psql --tuples-only --no-align --dbname="$APP_DATABASE_URL" -c "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname='$ix')")
  if [ "$exists" != "t" ] && [ "$exists" != "true" ]; then
    missing_idx+=("$ix")
  fi
done
if [ ${#missing_idx[@]} -ne 0 ]; then
  echo "ERROR: Missing expected indices: ${missing_idx[*]}" >&2
  exit 7
fi

echo "[*] Migrations applied and validated successfully. Pre-migration dump on host: $PRE_DUMP_FILE"
echo "To rollback manually inside container: docker exec postgres_prod_v2 pg_restore --no-owner --dbname=\"$APP_DATABASE_URL\" $PRE_DUMP_CONTAINER_PATH"
echo "To rollback from host copy: docker exec -i postgres_prod_v2 pg_restore --no-owner --dbname=\"$APP_DATABASE_URL\" /tmp/$(basename "$PRE_DUMP_FILE")"

exit 0
