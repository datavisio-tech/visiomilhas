# Environment Segregation Plan v1

Status: Approved for planning
Date: 2026-06-03

## 1) Official Architecture

### DEV

- URL: `localhost`
- Role: local application development
- Database layer:
  - `postgres_db`
  - `mongodb`
- Note:
  - DEV and HM share the same base databases at this stage to keep cost and complexity low.

### HM

- URL: `hm.visiomilhas.visiochat.cloud`
- Infrastructure:
  - `visiomilhas_app`
  - `postgres_db`
  - `mongodb`
- Role:
  - functional validation
  - MCP tests
  - OAuth tests
  - journey validation
  - pre-production validation

### PROD

- URL: `visiomilhas.visiochat.cloud`
- Infrastructure:
  - `visiomilhas_prod`
  - `postgres_prod_v2`
  - `mongodb_prod_v2` *(future)*
- Database names for the current runtime contract:
  - `controle_adm_saas_datavisio`
  - `visiomilhas_app`
- Characteristics:
  - empty database
  - clean bootstrap
  - no data migration
  - no DEV/HM data inheritance

## 2) Environment Matrix

| Environment | APP_URL | NEXT_PUBLIC_APP_URL | NODE_ENV | USE_FIFO_MOVEMENTS_ENGINE | PostgreSQL endpoint | Mongo endpoint | Auth/OAuth |
|---|---|---|---|---|---|---|---|
| DEV | localhost URL | localhost URL | development | 0 | shared `postgres_db` | shared `mongodb` | local-only secrets or dev environment |
| HM | `https://hm.visiomilhas.visiochat.cloud` | `https://hm.visiomilhas.visiochat.cloud` | production | 0 unless explicitly enabled | shared `postgres_db` | shared `mongodb` | shared Google OAuth client |
| PROD | `https://visiomilhas.visiochat.cloud` | `https://visiomilhas.visiochat.cloud` | production | 0 unless explicitly enabled | `postgres_prod_v2` | `mongodb_prod_v2` future | shared Google OAuth client |

## 3) Secrets Matrix

### DEV

- Stored locally in `.env.local`
- Typical values:
  - `APP_NAME`
  - `APP_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `BETTER_AUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `SAAS_DB`
  - `APP_DB`
  - `MONGODB_SERVER_IP`
  - `MONGODB_USER`
  - `MONGODB_USER_PASSWORD`
  - `MONGODB_DATABASE`

### HM

- GitHub Environment: `hm`
- Typical required secrets/vars:
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
  - `ADM_DATABASE_URL`
  - `APP_DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `MONGODB_SERVER_IP`
  - `MONGODB_USER`
  - `MONGODB_USER_PASSWORD`
  - `MONGODB_DATABASE`

### PROD

- GitHub Environment: `production`
- Typical required secrets/vars:
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
  - `ADM_DATABASE_URL`
  - `APP_DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `MONGODB_SERVER_IP`
  - `MONGODB_USER`
  - `MONGODB_USER_PASSWORD`
  - `MONGODB_DATABASE`
  - SSH deploy secrets/vars used by the workflow

## 4) Branch Strategy

- `develop` -> HM
- `main` -> PROD

Rules:

- HM receives integration and validation work first.
- PROD receives only hardened changes approved in HM.
- No direct deploy to PROD from ad hoc branches.

## 5) Workflow Strategy

### `deploy-hm.yml`

- Trigger:
  - push to `develop`
  - manual dispatch when needed
- Before deploy:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- After deploy:
  - healthcheck
  - auth bootstrap
  - Google OAuth bootstrap
  - `/sign-in`
  - `/subscribe`
  - `/app/dashboard`

### `deploy-prod.yml`

- Trigger:
  - push to `main`
  - manual dispatch with explicit confirmation
- Before deploy:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- After deploy:
  - healthcheck
  - HTML DOCTYPE validation
  - auth bootstrap
  - Google OAuth bootstrap
  - `/subscribe`
  - `/app/accounts`
  - `/app/programs`
  - `/app/purchases`
  - session creation
  - database connectivity

## 6) Deployment Matrix

| Environment | Target | Deploy style | Database state | Rollout style |
|---|---|---|---|---|
| DEV | localhost | local run | developer-local | fast iteration |
| HM | `hm.visiomilhas.visiochat.cloud` | controlled deploy | shared DBs | pre-production validation |
| PROD | `visiomilhas.visiochat.cloud` | controlled deploy | empty bootstrap DBs | release cutover |

## 7) Bootstrap Plan for Empty PROD

1. Provision the new PostgreSQL production endpoint.
2. Create the required logical databases.
3. Apply schemas and migrations only.
4. Do **not** migrate DEV/HM data.
5. Start the runtime against the empty PROD databases.
6. Let the first real users create their own operational data.
7. Keep MongoDB production as a future cutover unless a currently proven runtime dependency blocks release.

## 8) Rollback Plan

- Keep the previous working image tag available.
- Keep the previous working environment snapshot available.
- If HM or PROD fails validation:
  - redeploy the last known-good SHA
  - revert workflow env change
  - do not attempt data migration rollback unless a migration was actually applied
- If the failure is auth/bootstrap:
  - revert the env/secret change first
  - validate `/api/auth/sign-in/social`

## 9) Observability Plan

- Docker container logs
- Traefik router/service logs
- Healthcheck endpoint
- Auth observability events
- Runtime browser console verification for white screens and hydration failures
- Docker inspect for:
  - image
  - working directory
  - healthcheck
  - environment

## 10) Automated Validation Plan

### Pre-deploy gates

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### HM post-deploy gates

- healthcheck
- auth bootstrap
- Google OAuth bootstrap
- `/sign-in`
- `/subscribe`
- `/app/dashboard`

### PROD post-deploy gates

- healthcheck
- HTML starts with `<!DOCTYPE html>`
- auth bootstrap
- Google OAuth bootstrap
- `/subscribe`
- `/app/accounts`
- `/app/programs`
- `/app/purchases`
- session creation
- database connectivity

### Blockers

- lint failure -> block deploy
- typecheck failure -> block deploy
- build failure -> block deploy
- healthcheck failure -> block deploy

## 11) Recommended Implementation Order

1. Freeze the architecture in docs.
2. Prepare HM and PROD workflow separation.
3. Formalize secret matrices per environment.
4. Add HM validations.
5. Add PROD validations.
6. Prepare empty PROD bootstrap.
7. Validate rollback and observability.
8. Update Google OAuth authorized redirect URIs for HM and PROD.

## 12) Notes

- Google OAuth is shared between HM and PROD.
- DEV remains local-first for speed.
- The PROD database starts empty and must not inherit DEV/HM data.
- This plan is architectural only; no code or migrations are changed by this document.

