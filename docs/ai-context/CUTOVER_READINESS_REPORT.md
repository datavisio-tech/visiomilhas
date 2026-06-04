# PROD V2 Cutover Readiness Report

## Executive Summary

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
- **Reason:** PROD V2 schema/bootstrap readiness is not fully evidenced in the repository snapshot.

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

| Risk | Severity | Notes |
|---|---:|---|
| Purchases browser/runtime instability | MEDIUM | No hard product failure evidenced; warning appears harness-related. |
| Session refresh instability | MEDIUM | No hard product failure evidenced; warning appears harness-related. |
| PROD V2 schema/bootstrap gap | BLOCKER | The repository does not prove that the APP lot migration is enforced for a fresh PROD V2 target. |
| Rollback after schema changes | HIGH | DB rollback depends on snapshot/backup, not ad hoc reversal. |

## Blockers

1. The repository does not show an enforced APP migration path in `deploy-prod.yml`.
2. The repository does not prove the APP journal has been fully advanced to include `0001_add_mile_point_lots.sql`.
3. The current production deploy workflow is image/deploy only; it does not bootstrap a fresh PROD V2 schema.

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
