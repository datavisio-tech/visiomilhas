# Rollback Plan

## Principle

Rollback must be explicit, reversible, and avoid uncontrolled changes to databases.

## Runtime rollback

- Re-deploy the previous image SHA.
- Repoint the service/container to the known-good artifact.
- Re-run healthcheck and smoke tests after rollback.

## Database rollback

- No migrations are executed in this preparation phase.
- Once Production V2 bootstrap begins, database rollback must use backup/snapshot rather than ad hoc destructive operations.

## Failure classes

- Build failure: stop before deploy.
- Healthcheck failure: stop and rollback image.
- Auth bootstrap failure: stop and rollback image/config.
- Route smoke failure: stop and inspect container/Traefik before any new code change.

## Minimum rollback checklist

1. Identify last known-good SHA.
2. Redeploy the previous image.
3. Confirm container starts.
4. Confirm healthcheck passes.
5. Confirm public URL serves HTML with `<!DOCTYPE html>`.
6. Confirm auth bootstrap does not return `503`.
