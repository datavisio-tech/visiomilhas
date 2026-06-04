# Deployment Runtime Validation

## Purpose

Teach agents to validate production deploys and runtime health before changing application code.

## When to use

Use this skill whenever a user reports one of these symptoms:

- white screen after deploy
- login failure in production
- `503` from auth endpoints
- React hydration errors
- routing issues behind Traefik
- mismatch between local and production behavior

## Required validation order

Always validate in this order:

1. public HTML
2. `document.doctype`
3. browser console
4. container runtime
5. active image SHA
6. Traefik routing
7. deploy workflow status

Do not start by editing React components.

## What to inspect

### HTML and browser

- Confirm the page starts with `<!DOCTYPE html>`
- Confirm the page does not collapse into a blank screen
- Confirm hydration completes
- Confirm `document.doctype` exists

### Console

Look specifically for:

- `React #418`
- `React #423`
- `HierarchyRequestError`
- `NotFoundError`
- auth bootstrap failures

### Container

Confirm:

- active container name
- active image SHA
- `WorkingDir`
- `Healthcheck`
- environment loaded into the process

### Traefik

Confirm:

- router for the public domain
- service target
- internal port
- backend container association

### Deploy

Confirm:

- commit SHA deployed
- GitHub Actions workflow success
- image published
- runtime updated on the host

## Authentication-specific rule

If Google OAuth or Better Auth fails in production:

1. capture the exact `redirect_uri` being sent
2. compare it with the expected callback path
3. validate `client_id`
4. validate environment loading in the container
5. only then inspect provider configuration

For this repository:

- DEV OAuth is local-only in `.env.local`
- HM and PROD share the same Google OAuth client
- `BETTER_AUTH_SECRET` is shared across DEV, HM and PROD

## Outputs expected from an agent using this skill

The agent should report:

- exact redirect URI sent to the provider
- exact callback expected by the code
- active image SHA
- active container name
- Traefik target
- whether the runtime mismatch is app-side or environment-side

## Non-goals

- do not modify authentication logic unless the runtime evidence proves it is necessary
- do not change Google Console values from this skill
- do not change secrets from this skill
- do not skip runtime validation because local build passed
