# Observability Audit

## Existing runtime signals

- `scripts/healthcheck.js`
  - polls `http://127.0.0.1:3000/`
  - passes only on HTTP 2xx/3xx
- `lib/server/auth-observability.ts`
  - structured auth and onboarding event logging
  - emits codes such as:
    - `AUTH_BOOTSTRAP_FAILED`
    - `AUTH_DB_TABLE_MISSING`
    - `OAUTH_REDIRECT_URI_MISMATCH`
    - `SESSION_RESOLUTION_FAILED`
    - `SUBSCRIPTION_ACCESS_GRANTED`
    - `TRIAL_ACTIVATED`
- `app/api/auth/[...all]/route.ts`
  - converts bootstrap/runtime failures into controlled `503` responses
- GitHub Actions production workflow
  - validates HTML, container status, and public URL

## Current smoke/health validation shape

- Build-time gates:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- Post-deploy gates:
  - container healthcheck
  - HTML starts with `<!DOCTYPE html>`
  - auth bootstrap
  - Google OAuth bootstrap
  - dashboard / subscribe / app route checks
  - Traefik route inspection
  - public URL reachability

## What is missing or still manual

- There is no dedicated external alerting system documented in the repo.
- The deepest failure visibility still depends on:
  - workflow logs
  - container logs
  - browser console
  - Traefik API inspection

## Recommendation

- Treat healthcheck + runtime auth events + public URL smoke tests as the minimum production observability baseline.
- Keep richer alerting as a future enhancement, not a go-live prerequisite.
