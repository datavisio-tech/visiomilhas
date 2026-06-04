# Next 90 Days Roadmap

[AGENT]
Nome do agente: Technical Debt Audit Agent
Status: TECH_DEBT_AUDIT_READY

## Objective

Reduce the highest-value technical debt without destabilizing the current product or the new environment segregation architecture.

## Guiding principle

The next 90 days should prioritize:

1. fewer deploy paths,
2. lower auth/onboarding fragility,
3. cleaner billing lifecycle,
4. better operational tests,
5. less polish debt in the UI.

## Days 0-30

### Goal

Stabilize the release machinery and remove the most expensive operational noise.

### Work items

- Consolidate deploy logic so HM and PROD remain the only active paths.
- Review whether the legacy manual production workflow should be archived or permanently disabled after the new flow is proven.
- Keep `lint`, `typecheck`, and `build` as hard gates.
- Add more explicit smoke validation for public HTML and auth bootstrap.
- Reduce the remaining `<img>` warnings in Purchases UI.

### Expected result

- clearer release flow
- lower maintenance burden on deploys
- less build noise

## Days 31-60

### Goal

Reduce auth/onboarding and subscription coupling.

### Work items

- Stabilize test users and scenarios for:
  - NOT_AUTH
  - NO_SUB
  - TRIAL
  - ACTIVE
- Add tighter automated coverage for access-gated routes and mutating endpoints.
- Formalize the "no subscription" read-only story in runtime and tests.
- Decide whether onboarding should keep auto-promoting into trial or preserve a stricter non-subscriber state.
- Move billing policy closer to a single, predictable access model.

### Expected result

- easier testing
- fewer surprises in onboarding
- more stable subscription semantics

## Days 61-90

### Goal

Prepare the system for mature billing evolution and lower future operational cost.

### Work items

- Formalize a grace period policy if it is going to exist as a real product behavior.
- Reduce the gap between plans, subscriptions, and billing events.
- Review whether billing configuration should remain deploy-driven or move closer to admin-driven management.
- Harden Docker and workflow secret handling.
- Improve observability for auth bootstrap, deployment health, and subscription state transitions.

### Expected result

- a more predictable billing lifecycle
- lower incident risk during future plan changes
- clearer release ownership

## Recommended priority order

### P0

1. Deploy path consolidation
2. Secret handling hardening
3. Auth/onboarding scenario isolation

### P1

4. Subscription/grace-period formalization
5. Billing event maturity
6. Automated smoke coverage for HM and PROD

### P2

7. Frontend performance polish
8. Routing/page-level cleanup
9. Documentation pruning and drift reduction

## Deliverables to expect by the end of the 90 days

- one deploy path for HM and one for PROD, with minimal divergence
- stable access scenarios in automated tests
- documented and enforced subscription lifecycle
- cleaner frontend warnings
- less manual operational load

## Success criteria

We should consider the technical debt reduced when:

- deploys are repeatable and easy to reason about
- auth and onboarding are stable under fresh-user scenarios
- billing behavior is explicit rather than implied
- the build remains clean
- smoke tests catch the most expensive regressions before users do

