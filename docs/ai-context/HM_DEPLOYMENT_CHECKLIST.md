# HM Deployment Checklist - VisioMilhas

## Status

HM_NOT_READY

## Scope

Homologation environment only:

- URL: `https://hm.visiomilhas.visiochat.cloud`
- Branch target: `develop`
- Workflow: `.github/workflows/deploy-hm.yml`

## 1) Secrets documented for HM

The HM workflow and environment docs reference the following required inputs:

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `APP_NAME`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `USE_FIFO_MOVEMENTS_ENGINE`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`
- `BETTER_AUTH_SECRET` or `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## 2) HM environment creation checklist

- [ ] DNS record points `hm.visiomilhas.visiochat.cloud` to the HM ingress / Traefik entrypoint.
- [ ] Traefik is configured to route the HM host to the HM service.
- [ ] TLS certificate is available for the HM hostname.
- [ ] HM GitHub Environment secrets are present and non-empty.
- [ ] HM service directory exists on the target host.
- [ ] HM remote compose / runtime files can be written by the deploy user.
- [ ] HM runtime database URLs point to the shared HM databases.
- [ ] Google OAuth Console has the HM callback URI registered and validated manually.

## 3) Infrastructure requirements

### DNS

- `hm.visiomilhas.visiochat.cloud`

### Traefik

- Traefik must expose the HM host.
- Public routing must reach the HM container/service.
- The HM route must be visible in the Traefik dashboard / API after deploy.

### Certificates

- TLS certificate for `hm.visiomilhas.visiochat.cloud`
- Certificate resolver already defined in the Traefik stack

### Secrets / variables

- App URLs must resolve to HM.
- PostgreSQL connection values must resolve to the HM shared databases.
- Better Auth must have a non-empty secret.
- Google OAuth client credentials must be present.

## 4) Workflow audit

### `.github/workflows/deploy-hm.yml`

- Syntax: valid
- Gates: `npm run lint`, `npm run typecheck`, `npm run build`
- Post-deploy validation:
  - healthcheck
  - `DOCTYPE` validation
  - auth bootstrap check
  - OAuth bootstrap check
  - Google redirect URL validation

## 5) HM validation plan

After deploy, validate:

- Login
- Google OAuth
- Subscribe
- Dashboard
- Purchases
- Accounts
- Programs

## 6) HM smoke test plan

Required routes:

- `/`
- `/sign-in`
- `/subscribe`
- `/app`
- `/app/dashboard`

Required checks:

- HTTP response is successful or expected redirect
- HTML contains `<!DOCTYPE html>`
- Auth bootstrap does not return `503`
- OAuth bootstrap returns a Google redirect URL

## 7) HM rollback plan

- Re-deploy the last known-good SHA.
- Confirm container healthcheck passes.
- Confirm public URL still serves `<!DOCTYPE html>`.
- Confirm auth bootstrap does not return `503`.
- Inspect Traefik routing if the host stops resolving correctly.

## 8) Readiness summary

HM is ready for deploy once:

- DNS resolves
- Traefik routes the host
- HM secrets are present
- OAuth client is authorized for HM callback
- Workflow validation stays green
- Manual Google OAuth console update is confirmed
