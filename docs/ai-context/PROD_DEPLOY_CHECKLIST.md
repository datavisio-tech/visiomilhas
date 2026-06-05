# PROD Deploy Checklist

## Pre-Deploy

- Confirm the release candidate SHA to be promoted.
- Confirm HM warnings are understood and documented.
- Confirm the target PROD environment uses the expected host and branch mapping.
- Confirm the required production secrets are present.
- Confirm the production database state is ready for the current schema.
- Confirm `db/app/migrations/0001_add_mile_point_lots.sql` was applied to the PROD V2 APP database.
- Confirm read-only SQL validation returns `FOUND` for `mile_point_lots`, auxiliary columns, indexes, `fk_mpl_account`, and `chk_mpl_acquired_positive`.
- Confirm a rollback target SHA is known.
- Confirm backups or snapshots are available before any schema-affecting promotion.

## Deploy

- Trigger `deploy-prod.yml`.
- Confirm the workflow runs against `main`.
- Confirm the workflow uses the `production` environment.
- Confirm the environment render includes the expected application URLs and database targets.
- Confirm the remote directory is the production path, not HM.
- Confirm the container name and compose project are production-specific.

## Post-Deploy

- Confirm container healthcheck passes.
- Confirm public HTML responses return `<!DOCTYPE html>`.
- Confirm OAuth bootstrap returns a Google redirect and does not return `AUTH_BOOTSTRAP_FAILED`.
- Confirm `/`, `/sign-in`, `/subscribe`, `/app`, `/app/dashboard`, `/app/accounts`, `/app/programs`, and `/app/purchases` are reachable.
- Confirm no 500/502/503 responses are emitted during the smoke pass.
- Confirm no `MISSING` result appears in the APP migration validation pass.

## Validation

- Validate authentication bootstrap.
- Validate session establishment and refresh.
- Validate dashboard, accounts, programs, purchases, and subscribe flows.
- Validate that the browser smoke suite is green or only carries known non-blocking noise.

## Rollback

- Keep the last known-good image SHA available.
- Keep the previous container image available on the host.
- Keep a rollback snapshot/backup if any schema change was applied.
- If the healthcheck or smoke fails, revert to the previous image before making new code changes.
