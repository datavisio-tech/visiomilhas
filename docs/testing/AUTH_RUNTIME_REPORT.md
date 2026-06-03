# AUTH_RUNTIME_REPORT - VisioMilhas

Operational summary for authentication runtime validation.

## State

- The official auth checklist lives in `docs/testing/AUTH_INTEGRATION_CHECKLIST.md`.
- The official test users live in `docs/testing/AUTH_TEST_USERS.md`.
- Runtime rounds should be recorded with the real runtime and Chrome DevTools MCP.
- This file stores accumulated auth runtime investigations when needed.

## 2026-06-02 - Auth Runtime Forensics: Google OAuth 503 in production

### Symptom

- `POST /api/auth/sign-in/social` returned `503 Service Unavailable` in production.
- Google login works locally.

### Real endpoint response

```json
{"ok":false,"error":"AUTH_BOOTSTRAP_FAILED","message":"Missing required environment variables: BETTER_AUTH_SECRET"}
```

### Container log

```txt
[auth:AUTH_BOOTSTRAP_FAILED] Better Auth bootstrap failed: missing or invalid environment
message: 'Missing required environment variables: BETTER_AUTH_SECRET'
```

### Files involved

- `app/api/auth/[...all]/route.ts`
- `lib/auth.ts`
- `lib/server/better-auth-config.ts`
- `lib/server/auth-observability.ts`

### Environment check on the active container

- `AUTH_SECRET`: AUSENTE
- `BETTER_AUTH_SECRET`: PRESENTE
- `BETTER_AUTH_URL`: AUSENTE
- `GOOGLE_CLIENT_ID`: PRESENTE
- `GOOGLE_CLIENT_SECRET`: PRESENTE
- `APP_URL`: PRESENTE
- `NEXT_PUBLIC_APP_URL`: PRESENTE

### Interpretation

- The `503` does not come from Google itself; it comes from the Better Auth bootstrap.
- `app/api/auth/[...all]/route.ts` turns a disabled auth instance into a `503` with `AUTH_BOOTSTRAP_FAILED`.
- The Google provider never initializes because the bootstrap fails first.
- `BETTER_AUTH_URL` being absent is not the primary blocker here because the code can fall back to `APP_URL` / `NEXT_PUBLIC_APP_URL` for base URL resolution.

### Classification

- Configuration / Environment / Bootstrap

## 2026-06-02 - Auth Bootstrap Environment Fix

### Change applied

- A production `BETTER_AUTH_SECRET` was populated with a non-empty value.
- The production deploy workflows now fail fast if `BETTER_AUTH_SECRET` and `AUTH_SECRET` are both empty.

### Effect expected

- Prevent future deploys from reaching production with an empty auth secret.
- Keep the `AUTH_BOOTSTRAP_FAILED` 503 from reappearing due to an empty secret.

## 2026-06-02 - OAuth Production Cutover

### Purpose

- Validate the transition from the development Google OAuth client to the production Google OAuth client using the newly updated GitHub secrets.

### Runtime expectation

- The application should continue to send the production callback URI:

```txt
https://visiomilhas.visiochat.cloud/api/auth/callback/google
```

### Validation checklist

- Confirm the active deployment uses the latest commit and image.
- Confirm the container was recreated after the secret update.
- Confirm the live Node process receives the production `GOOGLE_CLIENT_ID`.
- Confirm the generated Google OAuth URL uses the production client identifier.
- Confirm the OAuth flow reaches Google consent or returns a session after callback.

### Notes

- Do not log the full client secret.
- Do not change Better Auth logic or callback paths for this validation.
- If the mismatch persists, the remaining divergence is likely between the active Google Cloud Console client and the production secret set in GitHub.

### Live production validation performed in this round

- The production auth endpoint generated an OAuth URL using:

```txt
client_id=469564365250-b21amqa3fgjqs0c6rbeod71nfaul3ikk.apps.googleusercontent.com
redirect_uri=https://visiomilhas.visiochat.cloud/api/auth/callback/google
```

- The `redirect_uri` is correct and matches the code expectation.
- The Google response still redirected to `signin/oauth/error` with `redirect_uri_mismatch`.
- That means the runtime request still does not complete the cutover, even though the callback path is correct.
- The next operational checkpoint is to confirm that the newly created production OAuth client is the one currently loaded into the live container and that the active container was actually recreated after the secret update.
