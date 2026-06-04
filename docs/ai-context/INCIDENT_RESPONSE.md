# Incident Response

## Purpose

Provide the standard response flow for operational incidents in VisioMilhas.

## Incident categories

### Severity 1 - Critical

- production login broken
- blank white screen on core routes
- payment / access state inconsistent for many users
- production deploy rolled out broken

### Severity 2 - High

- OAuth mismatch
- auth bootstrap failure
- subscription access regression
- database connectivity issue in one environment

### Severity 3 - Medium

- warnings, degraded UX, missing polish, non-blocking regression

### Severity 4 - Low

- documentation drift
- minor UI warnings
- non-blocking operational noise

## Response steps

### 1. Triage

- Identify impacted environment.
- Determine whether the issue is DEV, HM or PROD.
- Confirm whether the issue is auth, billing, onboarding, deploy or UI.

### 2. Runtime validation

- Check the public route.
- Inspect `DOCTYPE`.
- Check the active container.
- Check the active image.
- Check the router/proxy.
- Check logs for bootstrap/runtime errors.

### 3. Data validation

- Confirm the expected database.
- Validate connectivity for ADM and APP separately.
- Check for access state mismatch.
- Check whether the user is in `NO_SUBSCRIPTION`, `TRIAL`, `ACTIVE`, `CANCELED`, `EXPIRED` or `SUSPENDED`.

### 4. Containment

- Stop additional deploys if the issue is production-wide.
- Freeze unrelated changes.
- Communicate the scope of impact.

### 5. Recovery

- Roll back image if needed.
- Revalidate healthcheck and public routes.
- Revalidate auth bootstrap and OAuth.
- Reconfirm data integrity.

### 6. Post-incident follow-up

- Record timeline.
- Record root cause.
- Record detection gap.
- Record remediation and prevention actions.

## Blank screen / hydration failure playbook

1. Validate raw HTML.
2. Confirm `document.doctype`.
3. Confirm active container/image.
4. Validate Traefik/proxy routing.
5. Validate runtime before changing React components.

## Auth failure playbook

1. Confirm `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
2. Confirm bootstrap response.
3. Confirm the Google OAuth redirect URI.
4. Confirm the response is not `AUTH_BOOTSTRAP_FAILED`.

## Billing failure playbook

1. Confirm the subscription row exists.
2. Confirm the access state.
3. Confirm the plan code and trial window.
4. Check `billing_events`.
5. Check whether the issue is plan policy or runtime derivation.

## Rollback criteria

- the issue affects production availability
- the root cause is clearly tied to a recent release
- rollback is safer than forward fix

## Required evidence after response

- timestamp
- impacted environment
- root cause
- rollback performed or not
- final validation status

