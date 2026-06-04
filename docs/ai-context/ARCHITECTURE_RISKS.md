# Architecture Risks

[AGENT]
Nome do agente: Technical Debt Audit Agent
Status: TECH_DEBT_AUDIT_READY

## Purpose

Record the architectural risks that remain after the current cleanup work, with emphasis on maintenance cost, failure modes, and release risk.

## Risk register

### 1. Multiple deployment paths can drift

- **Severity:** CRITICAL
- **Area:** workflows / deploy
- **Description:** the repository still contains more than one production deployment path, plus a legacy manual workflow.
- **Impact:** a fix may reach one route but not another; operational expectations diverge.
- **Why it is risky:** release engineering becomes harder to reason about and rollback becomes less predictable.

### 2. Build-time secrets are still passed as arguments

- **Severity:** CRITICAL
- **Area:** docker / workflows
- **Description:** deploy flows still assemble sensitive env values and feed them into Docker build arguments.
- **Impact:** sensitive material is handled in a way that is harder to audit and reason about.
- **Why it is risky:** security review burden remains high and build logs/metadata remain a concern.

### 3. Auth bootstrap is environment-sensitive by design

- **Severity:** HIGH
- **Area:** auth
- **Description:** Better Auth fails fast if the required environment is incomplete.
- **Impact:** a bad secret or missing env can disable login for the whole app.
- **Why it is risky:** the app is safe, but brittle under configuration drift.

### 4. OAuth still requires manual Google Console coordination

- **Severity:** HIGH
- **Area:** auth / deploy
- **Description:** HM and PROD rely on manual redirect/origin configuration in Google Cloud Console.
- **Impact:** cutovers can fail even when code and secrets are correct.
- **Why it is risky:** release success depends on an external manual step.

### 5. Onboarding and subscription bootstrap are tightly coupled

- **Severity:** HIGH
- **Area:** onboarding / subscription
- **Description:** first owner creation, organization provisioning, trial activation and commercial access are linked in runtime flows.
- **Impact:** it is hard to test one stage without causing the next one.
- **Why it is risky:** the "no subscription" scenario is difficult to preserve as an isolated state.

### 6. Grace period is not first-class yet

- **Severity:** HIGH
- **Area:** subscription
- **Description:** there is no dedicated persisted grace-period concept in the commercial state model.
- **Impact:** future billing policy changes may require awkward runtime interpretation.
- **Why it is risky:** policy could become fragmented across code paths if not formalized.

### 7. Runtime access control and business pages are strongly coupled

- **Severity:** MEDIUM
- **Area:** backend / frontend
- **Description:** dashboard and operational routes resolve access, ownership and financial integrity in the same render path.
- **Impact:** any change in access policy can affect rendering and data fetching.
- **Why it is risky:** changes are safe only when carefully sequenced.

### 8. Some frontend surfaces still use raw images

- **Severity:** MEDIUM
- **Area:** frontend
- **Description:** Purchases UI still has `next lint` warnings for `<img>`.
- **Impact:** performance and UX are slightly less optimal.
- **Why it is risky:** it is not a functional defect, but it accumulates polish debt.

### 9. Dynamic server rendering is intentional but noisy

- **Severity:** MEDIUM
- **Area:** backend / Next.js
- **Description:** build-time logs show `SESSION_RESOLUTION_FAILED` for routes that deliberately use `headers()` and dynamic runtime access.
- **Impact:** noisy build logs make real regressions harder to notice.
- **Why it is risky:** harmless today, but easy to misread during incident response.

### 10. Billing evolution is ahead of automation

- **Severity:** MEDIUM
- **Area:** subscription / billing
- **Description:** the architecture documents monthly, annual, trial, cancellation and billing events, but the automated commercial lifecycle is still maturing.
- **Impact:** plan evolution can outpace operational enforcement if not coordinated.
- **Why it is risky:** inconsistent commercial rules create support burden.

## Most important architectural constraint

The system is healthiest when these are kept separate:

- authentication bootstrap
- onboarding bootstrap
- commercial access evaluation
- payment/catalog evolution
- deployment orchestration

When they get fused too tightly, maintenance cost rises sharply.

## Main risk pattern

The recurring risk pattern in the repo is not lack of features. It is **cross-cutting coupling**:

- auth reaches into provisioning
- onboarding touches trial policy
- subscription affects page rendering
- deploy scripts assemble runtime configuration
- billing is split between data model and runtime interpretation

## Risk mitigation priorities

1. Remove deploy-path duplication.
2. Reduce build-time secret handling risk.
3. Isolate subscription bootstrap tests.
4. Formalize grace period.
5. Reduce frontend polish debt.
6. Separate orchestration concerns from business logic wherever possible.

