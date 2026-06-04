# Release Promotion Pipeline

## Official pipeline

`Build Once -> Deploy HM -> Smoke HM -> Integration Tests ->`

- `GitHub Pre-release` for RC, or
- `Human Approval -> Deploy PROD -> Smoke PROD -> GitHub Release`

## Jobs

- `resolve_release`
  - determines tag and release type
- `build_once`
  - builds the Docker image one time and archives it
- `deploy_hm`
  - loads the archived image on HM and deploys it
- `smoke_hm`
  - runs Playwright against HM
- `integration_tests`
  - runs integration tests after HM is green
- `publish_rc_release`
  - creates or updates the GitHub pre-release
- `deploy_prod`
  - waits for `production` environment approval and deploys the same image
- `smoke_prod`
  - runs Playwright against PROD
- `publish_prod_release`
  - creates or updates the final GitHub Release as latest

## Artifact contract

- One image build per release tag.
- The exact same saved Docker image is loaded into HM and PROD.
- Host-specific `.env.production` files are rendered only at deploy time.

