# Rollback Plan

## Principle

Rollback must be explicit, reversible, and avoid uncontrolled changes to databases.

## Rollback triggers

Rollback is required when any of the following happen after a deploy:

- container healthcheck fails
- public HTML no longer renders `<!DOCTYPE html>`
- OAuth bootstrap returns `503` or `AUTH_BOOTSTRAP_FAILED`
- browser smoke reports hard failures
- production traffic hits repeated 500/502/503 responses
- a deployment introduces schema drift that cannot be reconciled safely

## Runtime rollback

1. Stop the current production container or service revision.
2. Re-deploy the last known-good image SHA.
3. Keep the production host path and compose project names isolated from HM.
4. Re-run healthcheck.
5. Re-run public HTML smoke checks.
6. Re-run OAuth bootstrap validation.

## Database rollback

- If no production schema migration was applied, rollback stays image-only.
- If a schema migration was applied, rollback must use a backup/snapshot or a rehearsed restore path.
- Do not attempt ad hoc destructive SQL in the middle of a live incident.

## Estimated recovery time

- Image-only rollback: 10-20 minutes
- Image rollback plus full validation: 20-40 minutes
- Schema rollback with snapshot restore: depends on backup size and restore time, typically longer than image-only rollback

## Minimum rollback checklist

1. Identify the last known-good SHA.
2. Confirm the previous image is still available.
3. Redeploy the previous image.
4. Confirm the container starts and stays healthy.
5. Confirm `<!DOCTYPE html>` is present on public routes.
6. Confirm auth bootstrap no longer returns `503`.
7. Confirm the smoke suite is back to its previous state.
