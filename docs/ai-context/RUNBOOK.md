# Runbook

## Purpose

Daily operational guide for VisioMilhas.

## Daily startup checklist

1. Confirm the correct environment.
2. Confirm the latest deployed SHA.
3. Confirm healthcheck is green.
4. Confirm the public URL resolves.
5. Confirm auth bootstrap works.
6. Confirm the database connectivity for ADM and APP.

## HM deploy checklist

1. Ensure `develop` is the target branch.
2. Ensure HM secrets are present.
3. Run quality gates:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
4. Deploy HM.
5. Validate:
   - `/`
   - `/sign-in`
   - `/subscribe`
   - `/app`
6. Validate Google OAuth bootstrap.
7. Confirm dashboard and onboarding behavior.

## PROD deploy checklist

1. Ensure `main` is the target branch.
2. Ensure production secrets are present.
3. Run quality gates:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
4. Deploy production.
5. Validate:
   - healthcheck
   - `DOCTYPE`
   - auth bootstrap
   - Google OAuth bootstrap
   - `/subscribe`
   - `/app/accounts`
   - `/app/programs`
   - `/app/purchases`
6. Confirm session creation and dashboard access.

## Auth operational checks

- `AUTH_BOOTSTRAP_FAILED` should not appear in healthy production.
- OAuth responses should continue to Google consent or callback as expected.
- `redirect_uri_mismatch` should be treated as a release blocker.

## Billing operational checks

- trial activation must create or update the subscription record
- `TRIAL` must remain full access
- `ACTIVE` must remain full access
- `CANCELED` and `EXPIRED` must be gated consistently

## Database checks

- confirm ADM DB is reachable
- confirm APP DB is reachable
- confirm no cross-database assumptions are leaking into runtime

## Rollback checklist

1. Revert to last known good SHA.
2. Re-deploy previous image.
3. Revalidate healthcheck.
4. Revalidate `DOCTYPE`.
5. Revalidate auth bootstrap.
6. Revalidate OAuth bootstrap.
7. Revalidate critical user journeys.

## Escalation triggers

- production 503 on auth
- blank screen on public routes
- OAuth mismatch
- database access regression
- suspicious deploy drift

