# Test Automation Runbook

## Purpose

Keep browser automation and unit automation separate so failures are easier to classify and recover.

## Execution order

1. Run unit/lint gates.
2. Run Playwright browser smoke tests.
3. If browser tests fail, isolate the root cause before changing unrelated code.
4. Re-run only the affected lane.

## Isolation rules

- Vitest should not own browser setup.
- Playwright should not inherit unit-test bootstraps.
- Browser smoke tests should not share flaky state across routes.
- Keep HM browser tests scoped to the HM host.

## Suggested lanes

- `lint`
- `typecheck`
- `build`
- `playwright:hm`

## Playwright fallback behavior

If a browser helper is missing or unstable:
- use the failure registry
- apply the browser-related playbook
- continue with HTTP/runtime checks if the SaaS is still healthy

## Evidence to capture

- route status
- redirect target
- console errors
- network 4xx/5xx
- session state
