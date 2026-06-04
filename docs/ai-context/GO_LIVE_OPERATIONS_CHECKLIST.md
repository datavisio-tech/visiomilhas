# Go-Live Operations Checklist

## Pre go-live

- Confirm the release SHA.
- Confirm the target environment.
- Confirm the correct secrets are present.
- Confirm the Google OAuth redirect URIs and origins are configured.
- Confirm database availability for ADM and APP.
- Confirm rollback plan is ready.

## Build gates

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Deployment gates

- deploy workflow started from the correct branch
- container image built successfully
- container started successfully
- healthcheck passed
- Traefik/proxy routing verified

## Post-deploy smoke tests

- `/`
- `/sign-in`
- `/subscribe`
- `/app`
- `/app/accounts`
- `/app/programs`
- `/app/purchases`

## Auth verification

- no `AUTH_BOOTSTRAP_FAILED`
- Google OAuth bootstrap returns a Google redirect URL
- login reaches consent or callback as expected

## Billing verification

- `NO_SUBSCRIPTION` behavior is understood
- `TRIAL` is available and grants full access
- `ACTIVE` grants full access
- `CANCELED` and `EXPIRED` behave as expected

## Data verification

- ADM DB reachable
- APP DB reachable
- subscription rows exist as expected
- billing events are written when commercial actions occur

## Rollback conditions

- smoke test fails
- auth bootstrap fails
- blank screen detected
- routing is incorrect
- critical route returns an unexpected error

## Rollback steps

1. Revert to last known good SHA.
2. Re-deploy previous image.
3. Re-run healthcheck.
4. Re-run smoke tests.
5. Confirm business-critical journeys are restored.

