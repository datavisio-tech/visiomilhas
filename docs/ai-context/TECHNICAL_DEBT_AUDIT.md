# Technical Debt Audit

[AGENT]
Nome do agente: Technical Debt Audit Agent
Status: TECH_DEBT_AUDIT_READY

## Scope

Areas audited:

- frontend
- backend
- auth
- onboarding
- subscription
- workflows
- docker
- deploy

## Executive summary

The repository is in a healthier state than before the environment segregation work, but it still carries meaningful technical debt in three places:

1. **Operational pipeline complexity**: multiple deploy workflows, remote sync, SSH-based build and stack promotion.
2. **Auth + onboarding coupling**: Better Auth, first owner creation, organization provisioning, and trial activation are tightly linked.
3. **Commercial model maturation**: plans, cancellation, grace period and event-driven billing are documented and partially implemented, but not yet fully normalized into a single mature billing system.

Build quality is currently acceptable:

- `npm run lint` passes with existing `<img>` warnings.
- `npm run typecheck` passes.
- `npm run build` passes.

So the debt here is not "broken build" debt. It is **maintenance, operability, and long-term evolution debt**.

## Severity classification

### CRITICAL

- Secrets are still injected into the Docker build as `ARG`s in the deploy workflows and Dockerfile contract.
  - This is a high-sensitivity operational practice.
  - Even when not printed, build-arg secret handling is a recurring security and maintainability risk.

### HIGH

- Deployment logic is split across multiple flows:
  - `deploy-hm.yml`
  - `deploy-prod.yml`
  - `production-deploy-manual.yml` legacy path
- HM/PROD deploys are still SSH-heavy and remote-state driven.
- Better Auth bootstrap still depends on environment completeness and can fail fast at runtime.
- Onboarding and subscription activation are tightly coupled in the first-run experience.
- The commercial model still lacks a first-class, persisted grace-period policy.

### MEDIUM

- Frontend still contains `next lint` warnings for `<img>` usage in Purchases UI.
- Several server-rendered routes emit `SESSION_RESOLUTION_FAILED` during static generation because they intentionally use `headers()` and dynamic runtime behavior.
- Billing catalog evolution is documented, but monthly/annual/grace-period maturation is not fully automated.
- Manual Google OAuth Console coordination remains part of the operational process.

### LOW

- Minor documentation drift and historical audit reports remaining in the workspace.
- Some older operational scripts are still present for compatibility and diagnostics.

## Frontend

### Findings

- The UI is generally modern and functional.
- The remaining frontend debt is mostly polish and consistency:
  - warnings for raw `<img>` elements in Purchases components
  - some pages still depend on server-side dynamic access resolution
  - the dashboard blends financial diagnostics, access policy, and operational KPIs into one dense page

### Risk level

- **MEDIUM**

### Why it matters

- `<img>` usage is a performance and UX smell.
- The dashboard is powerful, but the coupling between rendering and runtime checks makes it harder to evolve independently.

## Backend

### Findings

- Business logic is well consolidated, but central modules are doing a lot:
  - access evaluation
  - org provisioning
  - trial activation
  - audit events
  - consistency checks
- A lot of the business behavior lives in server modules rather than narrow domain services.

### Risk level

- **HIGH**

### Why it matters

- These modules are stable today, but they are a natural hotspot for regressions as billing and onboarding continue to evolve.

## Auth

### Findings

- Better Auth bootstrap is robust now, but it is still highly environment-sensitive.
- The system has a deliberate fail-fast path:
  - missing env -> `AUTH_BOOTSTRAP_FAILED`
  - runtime disable -> 503 on auth routes
- Google OAuth remains operationally dependent on external console configuration.

### Risk level

- **HIGH**

### Why it matters

- Auth is a foundation service; when it breaks, the whole app feels down.
- The current design is correct, but not yet low-friction.

## Onboarding

### Findings

- Onboarding is not a simple wizard; it is part of the commercial bootstrap.
- The first owner, first organization, first account, and first trial are all coupled.
- The runtime can auto-progress `NO_SUB` into `TRIAL` during first-access flows, which makes the "read-only non-subscriber" scenario hard to keep stable in practice.

### Risk level

- **HIGH**

### Why it matters

- The onboarding path is correct for product activation, but difficult to test and reason about when we need stable non-subscriber scenarios.

## Subscription

### Findings

- Plans exist and are persisted.
- Subscriptions exist and record trial and access metadata.
- Billing events exist, but the system is not yet fully event-driven.
- Trial and access state are well modeled, but grace period is still policy-level rather than first-class runtime behavior.

### Risk level

- **HIGH**

### Why it matters

- Billing is one of the most change-sensitive areas.
- If plan evolution outruns the runtime model, the system can drift into inconsistent access decisions.

## Workflows

### Findings

- The new HM and PROD workflows are materially better than the older monolithic deploy path.
- However, the repo still carries:
  - a legacy manual production workflow
  - duplicated deployment logic
  - SSH-based remote orchestration
  - environment-variable assembly in workflow steps

### Risk level

- **CRITICAL**

### Why it matters

- The more deploy paths we keep alive, the easier it is for drift to creep in.
- Workflow complexity becomes the long-term tax on every release.

## Docker

### Findings

- The Dockerfile is now much cleaner than before the workdir collision fix.
- The remaining debt is not functional failure, but build-time secret handling and portability assumptions.

### Risk level

- **HIGH**

### Why it matters

- Build args for secrets and environment coupling are maintainability and security risks.

## Deploy

### Findings

- Deployment is operationally sound, but still manual and script-heavy.
- The stack relies on:
  - SSH
  - remote directory sync
  - remote env rendering
  - remote Docker build
  - runtime verification via container exec and Traefik

### Risk level

- **HIGH**

### Why it matters

- This works, but it is not cheap in cognitive load.
- Every future change to the deployment contract has many moving parts.

## Summary table

| Area | Severity | Main debt |
|---|---:|---|
| Frontend | MEDIUM | `<img>` warnings, dense rendering, mixed concerns in dashboard |
| Backend | HIGH | Hotspot business modules and cross-cutting logic |
| Auth | HIGH | Environment-sensitive bootstrap and external OAuth dependency |
| Onboarding | HIGH | Tight coupling with trial activation and org provisioning |
| Subscription | HIGH | Billing model still maturing; grace period not first-class |
| Workflows | CRITICAL | Multiple deploy paths and drift risk |
| Docker | HIGH | Secret handling via build args and build-time coupling |
| Deploy | HIGH | SSH/remote-state-heavy release flow |

## What is already good

- Build is green.
- Typecheck is clean.
- Lint is green with only known warnings.
- HM/PROD workflows exist and are separated.
- Better Auth bootstrap is protected and observable.
- Subscription state and access state are modeled explicitly.

## Recommendation

Treat the next investments as:

1. workflow consolidation,
2. auth/onboarding test hardening,
3. billing/grace-period maturation,
4. frontend cleanup for performance polish,
5. deployment secret handling hardening.

