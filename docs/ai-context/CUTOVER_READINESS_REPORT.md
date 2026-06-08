# PROD V2 Cutover Readiness Report

## Executive Summary

Update 2026-06-05 authenticated smoke correction:

- The remaining HM certification failure was traced to the Playwright smoke harness, not to HM runtime, Better Auth, OAuth, PostgreSQL, MongoDB, Traefik, or deploy infrastructure.
- Root cause: `tests-e2e/hm-smoke.spec.ts` used the visual email login modal as the primary authenticated-session bootstrap and waited for a `role=dialog` before validating protected routes.
- Current Better Auth-compatible smoke path: synthetic QA users can create a session through `/api/auth/sign-in/email`; the suite already used this endpoint in one authenticated recovery scenario.
- Correction applied: `ensureSignedIn` now uses Better Auth email API login first, validates the authenticated/session state, then navigates to protected HM surfaces. The visual login modal path remains only as fallback.
- `session refresh` is now a hard authenticated-session validation instead of returning early as a warning after login bootstrap failure.
- Validation status: pre-fix authenticated subset passed locally with warnings, confirming that HM auth and protected route access are operational. Post-fix rerun is pending because the local agent execution environment rejected additional Playwright execution due to usage-limit enforcement.

Update 2026-06-05:

- The GitHub-hosted runner -> VPS SSH timeout RCA was closed as a network-path issue before `sshd`.
- The VisioMilhas deploy path now uses a self-hosted GitHub Actions runner on the `visiochat` VPS for deploy jobs, labeled `self-hosted`, `linux`, `x64`, `visiomilhas-deploy`.
- Build, lint, typecheck, tests, Playwright smoke, integration tests, and release publishing remain on GitHub-hosted runners.
- Release promotion run `27035246181` passed build, artifact upload, self-hosted HM precheck, SSH configuration, source sync, HM deployment, runtime health, and public Traefik URL validation.
- HM certification remains incomplete because Playwright smoke passed 6/10 tests and failed 4 authenticated scenarios waiting for the login dialog.

Update 2026-06-04:

- `db/app/migrations/0001_add_mile_point_lots.sql` was operationally validated against the active HM runtime container `visiomilhas_hm`.
- Read-only SQL checks confirmed the expected table, auxiliary columns, indexes, FK, and check constraint objects are present in the runtime APP database used by HM.
- The host does not currently expose `/opt/datavisio/visiomilhas/.env.production`; therefore the same read-only validation could not be executed against PROD V2 from the deployed production runtime path.
- Final production decision remains **NO-GO** until PROD V2 has the migration applied and the same validation checklist returns `FOUND` for every required object.

The current HM release candidate is functionally close to production, but the current repository evidence is **not sufficient to promote it to PROD V2 yet**.

The two visible warnings are not hard product failures on their own:

- `purchases` looks like a browser/runtime instability or test-harness false positive, not a confirmed business-logic blocker.
- `session refresh` looks like a test/session instability, not a confirmed Better Auth failure.

However, there is a separate release-readiness blocker for PROD V2:

- The APP migration journal in the repository only lists `0000_misty_kulan_gath`.
- The repository contains `db/app/migrations/0001_add_mile_point_lots.sql`, and the Purchases runtime uses lot/account accounting paths that depend on that schema being available.
- `deploy-prod.yml` does not run migrations.
- `scripts/bootstrap-production-v2.ts` is planning-only and marks the APP lot migration as optional rather than enforced.

That means the repository does not prove that a fresh PROD V2 database will be ready for the current release without an external schema bootstrap step.

## Status

- **Overall status:** NO-GO
- **Reason:** Migration `0001_add_mile_point_lots.sql` is operationally validated in HM, but not yet evidenced on PROD V2.

## 2026-06-07 - PROD V2 Migration Applied (Operational Update)

- Evidence collected from PROD V2 operational run: `0000_misty_kulan_gath.sql` (bootstrap) was applied and `0001_add_mile_point_lots.sql` was applied successfully.
- Confirmed objects: table `mile_point_lots`, indices `idx_mpl_account_remaining`, `idx_mpl_source_entry` present in PROD V2 APP database.
- Repository synced with server-side parsing fix to `scripts/prod_v2_apply_bootstrap_and_ledger.sh` to avoid divergence.

- **HM release pipeline:** HM_RELEASE_PIPELINE_CERTIFIED (10/10 Playwright HM smoke PASS)
- **Next action for PROD:** Resolve PROD V2 schema/bootstrap gap before promoting to PROD.

## Migration 0001 Operational Validation

### Scope

- Migration: `db/app/migrations/0001_add_mile_point_lots.sql`
- Runtime validated: HM container `visiomilhas_hm`
- Validation type: read-only SQL metadata checks through the active application runtime database connection.
- Production runtime validation: not completed because `/opt/datavisio/visiomilhas/.env.production` was not present on the host.

### HM Validation Evidence

All required objects returned `FOUND`:

| Object                                | Status |
| ------------------------------------- | ------ |
| `mile_point_lots` table               | FOUND  |
| `mile_entries.consumed_lot_id`        | FOUND  |
| `mile_entries.consumed_points`        | FOUND  |
| `mile_entries.lot_snapshot`           | FOUND  |
| `mile_transfers.source_entry_id`      | FOUND  |
| `mile_transfers.destination_entry_id` | FOUND  |
| `idx_mpl_account_remaining`           | FOUND  |
| `idx_mpl_source_entry`                | FOUND  |
| `idx_me_account_occurred`             | FOUND  |
| `idx_mt_source_dest`                  | FOUND  |
| `fk_mpl_account`                      | FOUND  |
| `chk_mpl_acquired_positive`           | FOUND  |

### Production Decision Impact

- The migration itself is valid and operationally compatible with the active HM runtime.
- PROD V2 is not cleared until the same read-only SQL checks are executed against the PROD V2 APP database after applying the migration.
- The blocker changed from "migration unvalidated" to "PROD V2 application evidence missing".

## Purchases Analysis

### Symptom

The current smoke suite reports a warning on the Purchases surface.

### Evidence

- `tests-e2e/hm-smoke.spec.ts` tolerates React minified errors:
  - `Minified React error #418`
  - `Minified React error #423`
  - `Minified React error #425`
- The Purchases cockpit is a complex client surface:
  - `src/modules/purchases/ui/PurchasesCockpit.client.tsx`
  - `src/modules/purchases/ui/NewPurchaseDrawer.client.tsx`
- Purchases persistence is transactional:
  - `app/api/purchases/create/route.ts`
  - `app/api/purchases/change-status/route.ts`
  - `src/modules/purchases/application/services.ts`
- Purchases accounting touches the FIFO/lot layer on `RECEIVED` transitions:
  - `src/modules/purchases/application/services.ts`
  - `src/modules/purchases/infrastructure/drizzle-repo.ts`
  - `db/app/schema.ts`

### Root-Cause Assessment

The warning is best classified as a **browser/runtime instability or test false positive**, not a confirmed purchase-domain bug:

- The smoke harness explicitly downgrades React minified errors to soft issues.
- The purchase flow itself is implemented with server-side persistence and transactional changes.
- No committed evidence shows a hard 500/502/503 failure in the purchase APIs.

### User Impact

Low to medium operational impact:

- The UI surface is noisy and deserves follow-up.
- The core purchase path is still present and transactional.
- The warning alone does not block production promotion.

### Severity

**MEDIUM**

## Session Refresh Analysis

### Symptom

The current smoke suite reports a warning on session refresh.

### Evidence

- Session resolution is centralized:
  - `lib/server/controlled-session.ts`
  - `lib/server/better-auth-session.ts`
- Better Auth bootstrap is explicit and defensive:
  - `lib/server/better-auth-config.ts`
  - `app/api/auth/[...all]/route.ts`
- Test-user discovery exists and is the official source of synthetic QA users:
  - `docs/ai-context/TEST_USERS.md`
  - `tests-e2e/test-user-discovery.ts`
- The smoke suite signs in, reloads, and checks subscription access:
  - `tests-e2e/hm-smoke.spec.ts`

### Root-Cause Assessment

The warning is best classified as a **test/session instability or harness false positive**, not a confirmed Better Auth session-refresh bug:

- The session stack has an explicit success path for Better Auth refresh.
- The smoke suite itself contains fallback behavior and warning annotations for unstable QA flows.
- No committed evidence shows a persistent session-loss bug in the runtime layer.

### User Impact

Low to medium operational impact:

- The refresh path should be monitored.
- The warning does not currently show a hard runtime blocker in the repository evidence.

### Severity

**MEDIUM**

## Release Risks

| Risk                                  | Severity | Notes                                                                                            |
| ------------------------------------- | -------: | ------------------------------------------------------------------------------------------------ |
| Purchases browser/runtime instability |   MEDIUM | No hard product failure evidenced; warning appears harness-related.                              |
| Session refresh instability           |   MEDIUM | No hard product failure evidenced; warning appears harness-related.                              |
| PROD V2 schema/bootstrap gap          |  BLOCKER | The repository does not prove that the APP lot migration is enforced for a fresh PROD V2 target. |
| PROD V2 migration validation missing  |  BLOCKER | HM has validated objects; PROD V2 still needs the same read-only validation after application.   |
| Rollback after schema changes         |     HIGH | DB rollback depends on snapshot/backup, not ad hoc reversal.                                     |

## Blockers

1. PROD V2 has not been read-only validated for `0001_add_mile_point_lots.sql`.
2. The current production deploy workflow is image/deploy only; it does not bootstrap or validate a fresh PROD V2 schema.
3. The production runtime env file was not present at `/opt/datavisio/visiomilhas/.env.production`, so runtime-based PROD V2 validation could not be completed from the host.

## Decision

**NO-GO**

The release candidate is strong enough to keep moving toward cutover, but it should not be promoted to PROD V2 until the schema/bootstrap gap is explicitly resolved and evidenced.

## Files Analyzed

- `tests-e2e/hm-smoke.spec.ts`
- `tests-e2e/test-user-discovery.ts`
- `playwright.config.ts`
- `package.json`
- `app/app/purchases/page.tsx`
- `app/api/purchases/create/route.ts`
- `app/api/purchases/change-status/route.ts`
- `app/api/purchases/[id]/route.ts`
- `app/api/purchases/[id]/evidences/route.ts`
- `src/modules/purchases/application/services.ts`
- `src/modules/purchases/infrastructure/queries.ts`
- `src/modules/purchases/infrastructure/drizzle-repo.ts`
- `src/modules/purchases/presentation/purchases-dashboard.viewmodel.ts`
- `src/modules/purchases/domain/state-machine.ts`
- `lib/server/controlled-session.ts`
- `lib/server/better-auth-session.ts`
- `lib/server/better-auth-config.ts`
- `app/api/subscription/access/route.ts`
- `app/api/auth/[...all]/route.ts`
- `db/app/schema.ts`
- `db/app/migrations/0000_misty_kulan_gath.sql`
- `db/app/migrations/0001_add_mile_point_lots.sql`
- `db/app/migrations/meta/_journal.json`
- `db/adm/migrations/meta/_journal.json`
- `.github/workflows/deploy-hm.yml`
- `.github/workflows/deploy-prod.yml`
- `scripts/bootstrap-production-v2.ts`

## Points Not Analyzed

- Committed Playwright traces and screenshots were not available in the repository snapshot.
- Live production database state was not inspected.
- External GitHub Actions runtime logs were not available in the repository snapshot.
