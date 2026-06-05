# VisioMilhas Project Context

## Current state

- HM is validated and operational.
- Better Auth, Google OAuth, PostgreSQL, MongoDB, GitHub Actions, and Playwright are operational.
- The project is moving from independent HM/PROD deploy thinking to a release-first promotion pipeline.

## Official release model

- Releases are now the primary operational unit.
- HM is the release-candidate validation environment.
- Production is the human-approved promotion target.
- Build Once, Promote Many is the release contract.
- The same image artifact is promoted from HM to PROD.

## Environment model

- DEV: local development and exploratory validation.
- HM: homologation, smoke, and integration validation.
- PROD: customer-facing production after human approval.

## Release cadence

- RC tags use semantic pre-release forms such as `v2.0.0-rc.1` and `v2.0.0-beta.1`.
- Production tags use final semantic versions such as `v2.0.0` and `v2.0.1`.
