# PLAYWRIGHT SETUP

## Runtime modes

- `PLAYWRIGHT_MODE=visible` for DEV and HM
- `PLAYWRIGHT_MODE=headless` for PROD
- default behavior falls back to a visible browser for localhost and HM, and to headless for production hosts

## Observability baseline

- `headless: false` in visible mode
- `viewport: null`
- `screenshot: only-on-failure`
- `video: retain-on-failure`
- `trace: retain-on-failure`
- `slowMo: 300`
- Chromium starts maximized

## Test users

Browser validation must load official synthetic QA users from `docs/ai-context/TEST_USERS.md` before attempting to create or modify any account.

## Suite split

- `tests/domain` for unit tests
- `tests/integration` for integration tests
- `tests/runtime` for environment validation
- `tests-e2e` for browser validation
- `test-results` for generated artifacts only

## Operational reply discipline

- Any operational reply generated while working on browser validation must expose `AGENT`, `SKILLS`, `SOURCES CONSULTED`, and `STATUS`.
- Any draft missing those fields must be corrected internally before the final response is emitted.
