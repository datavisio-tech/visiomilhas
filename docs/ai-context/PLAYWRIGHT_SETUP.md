# Playwright Setup

## Operational baseline

Playwright is available and confirmed by a successful run:

- `npx playwright test --config=playwright.config.ts`
- result: `1 passed`

## Working rule

Playwright smoke tests must run in their own lane.

Do not mix:
- browser smoke tests
- unit tests
- Vitest assertions

The browser suite should remain deterministic and focused on real navigation and runtime behavior.

## Recommended isolation

- Keep browser specs in a dedicated folder such as `tests/e2e/`
- Keep unit specs in the existing unit-test lane
- Use a stable base URL for HM when running browser smoke tests
- Prefer route-level checks and visible UI assertions over implementation details

## What to verify in browser smoke tests

- homepage renders
- sign-in renders
- dashboard navigates or redirects correctly
- accounts renders or redirects correctly
- programs renders or redirects correctly
- purchases renders or redirects correctly
- subscribe renders or redirects correctly
