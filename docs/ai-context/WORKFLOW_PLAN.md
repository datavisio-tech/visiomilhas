# Workflow Plan - Environment Segregation

## Goal

Prepare DEV, HM, and PROD as distinct operational lanes without touching the currently active environment.

## Branch strategy

- `develop` -> HM
- `main` -> PROD

## Workflow strategy

- `.github/workflows/deploy-hm.yml`
  - trigger on `develop`
  - deploy target: `hm.visiomilhas.visiochat.cloud`
  - environment: `hm`

- `.github/workflows/deploy-prod.yml`
  - trigger on `main`
  - deploy target: `visiomilhas.visiochat.cloud`
  - environment: `production`

## Validation gates

Before deploy:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

After deploy:

- healthcheck
- auth bootstrap
- Google OAuth bootstrap
- DOCTYPE verification
- route smoke tests
- Traefik/public URL validation

## Operational notes

- HM and PROD must not reuse runtime assumptions silently.
- Secrets must be validated per environment before any deploy step starts.
- Production V2 bootstrap must remain a planned step, not an implicit side effect.
