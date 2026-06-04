# Cutover Process

## Purpose

Define the operational path for promoting a validated release from HM to PROD.

## Pre-cutover

- HM is green.
- Integration tests are green.
- Release tag is valid and immutable.
- Backup and rollback readiness are confirmed.

## Cutover steps

1. Wait for `production` GitHub Environment approval.
2. Deploy the same image artifact to PROD.
3. Run runtime health checks.
4. Run PROD smoke validation.
5. Publish the GitHub Release.
6. Mark the release as latest.

## Rollback

- Stop PROD container.
- Revert to the previous release artifact.
- Restore the previous `.env.production` if needed.
- Re-run runtime checks before reopening traffic.

