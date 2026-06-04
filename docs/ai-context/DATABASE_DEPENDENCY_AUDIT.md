# Database Dependency Audit

Status: Discovery
Date: 2026-06-02
Scope: PostgreSQL cutover planning for VisioMilhas Production V2

## Executive Summary

The audited production application currently uses **two PostgreSQL databases in the runtime path**:

1. **`controle_adm_saas_datavisio`**  
   Used by the admin/auth/billing tenant layer.

2. **`visiomilhas_app`**  
   Used by the operational ERP layer for accounts, programs, purchases, FIFO lots, movements, campaigns, and related business data.

The repository also contains **non-production support databases** used by migration/preflight tooling:

- `staging_db`
- `test_db`

Other database names observed in the hosting environment prompt (`datamilhas`, `datavisio`, `plenoconsult`, `plenopsi`, `visiomilhas_apphm`, `postgres`) were **not found in the current audited runtime path** and are therefore treated as legacy/external/unproven for this cutover scope.

## Databases Found

### Production runtime databases

| Database | Purpose | Evidence |
|---|---|---|
| `controle_adm_saas_datavisio` | Admin/auth/subscriptions/billing/audit/orgs | `db/adm/client.ts`, `drizzle.adm.config.ts`, `db/adm/schema.ts`, `lib/auth.ts` |
| `visiomilhas_app` | Operational ERP data | `db/app/client.ts`, `drizzle.app.config.ts`, `db/app/schema.ts` |

### Non-production support databases

| Database | Purpose | Evidence |
|---|---|---|
| `staging_db` | staging preflight / migration validation target | `scripts/preflight-db.ts`, `package.json` |
| `test_db` | test preflight / migration validation target | `scripts/preflight-db.ts`, `package.json` |

### Observed but not proven in current runtime

| Database name | Status in current audit |
|---|---|
| `datamilhas` | not referenced in the audited code path |
| `datavisio` | not referenced in the audited code path |
| `plenoconsult` | not referenced in the audited code path |
| `plenopsi` | not referenced in the audited code path |
| `visiomilhas_apphm` | not referenced in the audited code path |
| `postgres` | default maintenance database; not part of application runtime path |

## Configuration Map

### Environment variables and the database they reference

| File | Variable | Database referenced | Notes |
|---|---|---|---|
| `lib/env.ts` | `ADM_DATABASE_URL` | `controle_adm_saas_datavisio` | Required for admin runtime |
| `lib/env.ts` | `APP_DATABASE_URL` | `visiomilhas_app` | Required for operational runtime |
| `lib/env.ts` | `POSTGRES_ADMIN_DATABASE_URL` | PostgreSQL admin endpoint (cluster-level) | Used only by admin scripts |
| `db/admin/create-databases.ts` | `POSTGRES_ADMIN_DATABASE_URL` | admin endpoint | Creates allowed databases only |
| `db/seed/check-db-connections.ts` | `ADM_DATABASE_URL` | `controle_adm_saas_datavisio` | Runtime connectivity check |
| `db/seed/check-db-connections.ts` | `APP_DATABASE_URL` | `visiomilhas_app` | Runtime connectivity check |
| `scripts/preflight-db.ts` | `STAGING_DATABASE_URL` | `staging_db` | staging-only tooling |
| `scripts/preflight-db.ts` | `TEST_DATABASE_URL` | `test_db` | test-only tooling |
| `lib/auth.ts` | `ADM_DATABASE_URL` via `admDb()` | `controle_adm_saas_datavisio` | Better Auth adapter DB |
| `db/app/client.ts` | `APP_DATABASE_URL` | `visiomilhas_app` | Drizzle app client |
| `db/adm/client.ts` | `ADM_DATABASE_URL` | `controle_adm_saas_datavisio` | Drizzle admin client |

## Runtime Clients and Their Databases

### Admin DB client

- File: `db/adm/client.ts`
- Client factory: `admDb()`
- Connection string: `env.ADM_DATABASE_URL`
- Schema attached: `lib/server/better-auth-schema.ts`

### App DB client

- File: `db/app/client.ts`
- Client factory: `appDb()`
- Connection string: `env.APP_DATABASE_URL`
- Schema attached: operational app schema only

### Better Auth bootstrap

- File: `lib/auth.ts`
- Uses `admDb()` with `drizzleAdapter(...)`
- This means the auth layer lives on the **admin DB**

## Module Dependency Matrix

### `controle_adm_saas_datavisio`

Dependent modules:

- Auth
- OAuth / social providers
- Sessions
- Users
- Organizations
- Organization memberships
- Plans
- Subscriptions
- Billing events
- Admin audit logs

Relevant evidence:

- `db/adm/schema.ts`
- `lib/auth.ts`
- `lib/server/better-auth-config.ts`
- `lib/server/better-auth-schema.ts`
- `app/api/auth/[...all]/route.ts`

### `visiomilhas_app`

Dependent modules:

- Accounts / program accounts
- Programs / loyalty programs
- Purchases / purchase records
- FIFO lots / mile point lots
- Movements / mile entries
- Sales / mile sales
- Transfers / mile transfers
- Clubs / mile clubs
- Beneficiaries
- Business contacts
- Partner stores / campaigns
- Campaign snapshots

Relevant evidence:

- `db/app/schema.ts`
- `db/app/client.ts`
- `drizzle.app.config.ts`

## Cross-Database Dependencies

The runtime is split across two PostgreSQL databases:

- The **authentication and tenant control plane** reads from `controle_adm_saas_datavisio`
- The **operational ERP plane** reads from `visiomilhas_app`

That means a healthy production deployment requires both databases to be available at the same time.

There is no evidence in the audited code path that the current runtime depends on:

- `datamilhas`
- `datavisio`
- `plenoconsult`
- `plenopsi`
- `visiomilhas_apphm`

Those names should be treated as legacy or external until a separate audit proves otherwise.

## What Must Exist for Production V2 Cutover

### Mandatory

- `controle_adm_saas_datavisio`
- `visiomilhas_app`

### Recommended support infrastructure

- PostgreSQL administrative endpoint reachable through `POSTGRES_ADMIN_DATABASE_URL`
- Existing migration/preflight support for `staging_db`
- Existing migration/preflight support for `test_db`

### Legacy / not proven as runtime dependencies

- `datamilhas`
- `datavisio`
- `plenoconsult`
- `plenopsi`
- `visiomilhas_apphm`

### Not used by the application runtime

- `postgres` (maintenance/default database only)

## Cutover Minimum Scope

If we cut over today, the **minimum required databases** are:

1. `controle_adm_saas_datavisio`
2. `visiomilhas_app`

The system will not function fully without both, because:

- Better Auth is wired to the admin database.
- The operational ERP modules are wired to the app database.

## Risks If Cutover Misses a Database

- Missing admin DB:
  - login fails
  - OAuth fails
  - sessions fail
  - subscriptions/org access fail

- Missing app DB:
  - accounts cannot load
  - programs cannot load
  - purchases cannot load
  - FIFO lots and balances cannot be computed

- Missing `POSTGRES_ADMIN_DATABASE_URL`:
  - admin provisioning scripts cannot create or validate databases

- Confusing legacy databases with production:
  - accidental cutover to the wrong tenant data
  - inconsistent auth vs operational state

## Evidence Summary

### Auth/admin layer

- `db/adm/client.ts` uses `ADM_DATABASE_URL`
- `lib/auth.ts` uses `admDb()` with `drizzleAdapter(...)`
- `lib/server/better-auth-config.ts` requires auth env plus trusted origins
- `app/api/auth/[...all]/route.ts` converts bootstrap failures into `503`

### Operational layer

- `db/app/client.ts` uses `APP_DATABASE_URL`
- `db/app/schema.ts` defines the ERP operational entities

### Scripts

- `db/admin/create-databases.ts` allowlists:
  - `controle_adm_saas_datavisio`
  - `visiomilhas_app`
- `db/seed/check-db-connections.ts` validates both runtime URLs
- `scripts/preflight-db.ts` targets staging/test only

## Validation Checklist for Future Cutovers

- [ ] Confirm `ADM_DATABASE_URL` resolves to `controle_adm_saas_datavisio`
- [ ] Confirm `APP_DATABASE_URL` resolves to `visiomilhas_app`
- [ ] Confirm Better Auth bootstrap succeeds
- [ ] Confirm `/api/auth/sign-in/social` no longer returns `503`
- [ ] Confirm app routes load from the correct database
- [ ] Confirm migration/preflight scripts only target intended non-prod databases
- [ ] Confirm no legacy database name is accidentally wired into production env

