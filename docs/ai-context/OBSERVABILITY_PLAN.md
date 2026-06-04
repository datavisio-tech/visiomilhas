# Observability Plan

## Signals already present

- Healthcheck script for the local app container.
- Auth event logging in `lib/server/auth-observability.ts`.
- Route-level handling for auth bootstrap/runtime failures.
- Workflow-level smoke checks after deploy.

## Required production checks

- container health
- HTML starts with `<!DOCTYPE html>`
- auth bootstrap
- Google OAuth bootstrap
- route reachability
- Traefik routing

## Required routes to smoke test

HM:

- `/`
- `/sign-in`
- `/subscribe`
- `/app`
- `/app/dashboard`

PROD:

- `/`
- `/sign-in`
- `/subscribe`
- `/app`
- `/app/accounts`
- `/app/programs`
- `/app/purchases`
- `/app/dashboard`

## Logs to inspect

- GitHub Actions logs
- container logs
- auth observability events
- Traefik logs if routing fails

## Alerting posture

- No external alerting stack is required for this release.
- Workflow failures plus runtime smoke failures are the immediate release gate.
