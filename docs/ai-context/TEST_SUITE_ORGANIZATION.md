# Test Suite Organization

Last updated: 2026-06-04

This document is the official source of truth for how the VisioMilhas test suite is organized after Playwright introduction.

## Principles

1. Each test lane must own one responsibility.
2. Browser smoke checks must not live in the unit-test lane.
3. Integration tests must not duplicate browser journeys unless they are explicitly validating persistence behavior.
4. Test-result directories must never contain source code.
5. Any new suite must be classified before being added.

## Official lanes

### `tests/domain`

Purpose:
- pure business rules
- calculations
- deterministic unit assertions

Runner:
- Vitest

Allowed scope:
- no browser
- no live network
- no direct UI navigation

### `tests/integration`

Purpose:
- repository behavior
- database behavior
- service behavior
- persistence and transaction coverage

Runner:
- Vitest

Allowed scope:
- direct DB access
- service orchestration
- HTTP-free integration checks when possible

### `tests/runtime`

Purpose:
- environment validation
- deployment/runtime validation
- auth bootstrap validation
- healthcheck and host validation
- infrastructure-aware checks that are not browser-UI specific

Runner:
- runtime browser harness / Chrome DevTools MCP / HTTP checks

Allowed scope:
- SSH-backed or host-backed validation
- deployment validation
- healthcheck validation
- auth bootstrap validation
- environment variable and host state checks

### `tests-e2e`

Purpose:
- browser validation
- homepage, sign-in, dashboard, accounts, programs, purchases, subscribe, and session flows
- UI and browser-visible behavior under Playwright

Runner:
- Playwright

Rule:
- this lane owns browser-visible user journeys
- this lane should absorb browser UI checks that do not require host/deployment context
- it must not duplicate `tests/runtime` infrastructure checks

### `test-results`

Purpose:
- generated artifacts only

Rule:
- never store source code here
- never treat this directory as a canonical test lane

## Responsibility matrix

| Lane | Owns | Must not own |
|---|---|---|
| `tests/domain` | pure business logic | browser, DB, network, runtime smoke |
| `tests/integration` | DB/service integration | browser UX journeys |
| `tests/runtime` | environment validation, deploy/runtime checks, auth bootstrap, healthcheck | browser UI journeys that can live in Playwright |
| `tests-e2e` | browser validation and user journeys | infra/deploy/host checks |
| `test-results` | output artifacts | source code |

## Consolidation rule

When two lanes overlap, prefer the lane with the closest responsibility:

- business rule overlap -> `tests/domain`
- persistence overlap -> `tests/integration`
- infrastructure/runtime overlap -> `tests/runtime`
- browser/UI overlap -> `tests-e2e`

## Enforcement rule

Before adding a new test, classify it into one lane first.
If the lane is unclear, do not duplicate the test in another lane.

The owner of the lane decides whether the test belongs in:
- unit
- integration
- runtime/environment
- browser validation
- generated artifacts

## Migration guidance after Playwright

Browser-visible journeys that are currently in `tests/runtime` should migrate to `tests-e2e` when they primarily validate:
- page rendering
- navigation
- visible controls
- console/network errors
- browser session behavior

Keep tests in `tests/runtime` when they primarily validate:
- infrastructure state
- deploy behavior
- healthchecks
- auth bootstrap
- environment selection
- host connectivity
- runtime/service readiness
