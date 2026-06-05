# Post-Deploy Validation

## Smoke PROD

- Confirm APP migration `0001_add_mile_point_lots.sql` objects are present in PROD V2:
  - `mile_point_lots`
  - `mile_entries.consumed_lot_id`
  - `mile_entries.consumed_points`
  - `mile_entries.lot_snapshot`
  - `mile_transfers.source_entry_id`
  - `mile_transfers.destination_entry_id`
  - `idx_mpl_account_remaining`
  - `idx_mpl_source_entry`
  - `idx_me_account_occurred`
  - `idx_mt_source_dest`
  - `fk_mpl_account`
  - `chk_mpl_acquired_positive`
- Confirm `/` returns HTML with `<!DOCTYPE html>`.
- Confirm `/sign-in` renders and does not emit hydration/runtime errors.
- Confirm `/subscribe` renders and remains reachable.
- Confirm `/app` and the protected app routes resolve correctly.

## Functional Validation

- Confirm login works end-to-end.
- Confirm dashboard loads after login.
- Confirm accounts load and can be browsed.
- Confirm programs load and preserve app context.
- Confirm purchases render and are reachable.
- Confirm logout clears the session and forces re-authentication.
- Confirm session refresh survives a reload.

## Initial Monitoring

- Watch container health status.
- Watch auth bootstrap events.
- Watch public route response codes.
- Watch for repeated 401/403/404/500/502/503 responses.
- Watch for repeated React hydration noise on the browser surface.

## Success Criteria

- Healthcheck passes.
- Public HTML contains `<!DOCTYPE html>`.
- OAuth bootstrap returns a Google redirect URL.
- APP migration validation returns `FOUND` for all required `0001_add_mile_point_lots.sql` objects.
- The smoke suite is green or carries only known, non-blocking warnings.
- No new migration or rollback action is required immediately after deploy.
