# VisioMilhas Architecture

## Product architecture

- Next.js App Router
- TypeScript strict
- Drizzle ORM
- Better Auth
- Docker
- Traefik
- GitHub Actions
- Playwright for browser validation

## Environment architecture

### DEV

- Local development
- Uses the local browser and local runtime
- No production promotion

### HM

- Homologation and release-candidate validation
- Receives promoted release artifacts first
- Uses the `hm` GitHub Environment

### PROD

- Customer-facing production
- Receives the exact same artifact promoted in HM
- Uses the `production` GitHub Environment with approval rules

## Release architecture

- Build happens once in CI.
- The built Docker image is saved as a release artifact.
- HM deploys the artifact first.
- HM smoke and integration validation must pass.
- RC releases are published as GitHub pre-releases.
- Production releases require human approval, deploy the same artifact, then publish the GitHub Release as latest.

## Legacy paths

- `deploy-hm.yml` and `deploy-prod.yml` remain as legacy fallback workflows only.
- Official release promotion happens through `release-promotion.yml`.
