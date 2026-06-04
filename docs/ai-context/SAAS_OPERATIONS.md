# SaaS Operations

## Objective

Describe the operational flows required to run VisioMilhas safely in DEV, HM and PROD.

## Environment model

- **DEV**: local development, shared databases with HM for now.
- **HM**: functional validation, OAuth validation, smoke tests and pre-production rehearsal.
- **PROD**: clean bootstrap, isolated rollout, business validation and runtime monitoring.

## 1) Onboarding process

1. User authenticates.
2. System resolves controlled session and ownership context.
3. If the user has no organization, onboarding creates the first organization.
4. User is guided to create the first operational account/program pair.
5. User can register an initial balance.
6. Dashboard becomes the operational cockpit once the base context is ready.

### Operational expectation

- First owner must be able to complete the flow without manual database intervention.
- Onboarding must preserve the commercial state and the access state.

## 2) Trial process

1. User opens Subscribe.
2. System offers the 15-day trial.
3. Trial is activated explicitly.
4. Runtime persists the commercial window.
5. Access becomes `TRIAL`.
6. User keeps full access until the trial expires.

### Operational expectation

- Trial activation must be observable.
- Trial expiration must be detectable.
- Trial must not be confused with paid active access.

## 3) Subscription process

### Monthly

- recurring plan
- default conversion path after trial
- can be canceled according to policy

### Annual

- recurring yearly plan
- retention and pricing optimization path
- must preserve the same access model as monthly, with a different billing interval

### Access states

- `NO_SUBSCRIPTION`
- `TRIAL`
- `ACTIVE`
- `CANCELED`
- `EXPIRED`
- `SUSPENDED`

## 4) Cancellation process

1. User requests cancellation.
2. The subscription keeps historical data.
3. If the policy uses `cancel_at_period_end`, access continues until the end of the paid period.
4. After the cycle ends, access transitions to `CANCELED` or `EXPIRED` depending on the commercial rule.

### Operational expectation

- Cancellation must not destroy invoices, history or audit trail.
- Users must understand whether access ends immediately or at the end of the cycle.

## 5) Reactivation process

1. User returns after cancellation or expiration.
2. System resolves current access state.
3. If a valid plan is purchased or restored, access becomes active again.
4. Subscription history remains intact.

### Operational expectation

- Reactivation should not create contradictory duplicate subscriptions.
- Reactivation must be visible in billing events and access logs.

## 6) Support process

1. Support checks auth status.
2. Support checks access state.
3. Support checks subscription history.
4. Support checks deployment provenance and active image if runtime behavior is inconsistent.
5. Support checks the operational database and the admin database separately.

### Operational expectation

- Support should never guess the state of a user.
- Support should be able to tell whether the issue is auth, onboarding, billing or deploy.

## 7) Incident process

### Common incident classes

- blank screen / hydration failure
- auth bootstrap failure
- OAuth redirect mismatch
- subscription mismatch
- database inconsistency
- deploy drift

### Required sequence

1. Confirm user impact.
2. Validate public HTML and `DOCTYPE`.
3. Validate active container and image.
4. Validate proxy routing.
5. Validate auth bootstrap.
6. Validate database connectivity.
7. Only then inspect React or page logic.

## 8) Rollback process

1. Identify the last known good SHA.
2. Revert deployment to the previous image.
3. Validate healthcheck.
4. Validate public routes.
5. Confirm auth bootstrap and OAuth.
6. Validate that the rollback did not alter production data.

## Operational principles

- Separate runtime access checks from business UX where possible.
- Keep deploys reversible.
- Preserve billing and access history.
- Prefer explicit validation over assumption.

