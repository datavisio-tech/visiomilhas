# AUTH Environment Audit Report

## Summary

Production returns `503` on `POST /api/auth/sign-in/social` because the Better Auth bootstrap fails before the Google provider is initialized.

The key finding is not a missing container variable in general. The running Node process shows `BETTER_AUTH_SECRET` as present but empty (`length=0`, `trimmedLength=0`), while `AUTH_SECRET` is absent. The bootstrap validator treats an empty trimmed secret as missing, so it raises `AUTH_BOOTSTRAP_FAILED`.

## Evidence

### Request-time failure

Production response:

```json
{
  "ok": false,
  "error": "AUTH_BOOTSTRAP_FAILED",
  "message": "Missing required environment variables: BETTER_AUTH_SECRET"
}
```

### Files and logic involved

- `lib/server/better-auth-config.ts:53-68`
  - `resolveBetterAuthEnvironment()` validates:
    - `BETTER_AUTH_SECRET` or fallback `AUTH_SECRET`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
  - `BETTER_AUTH_URL` is optional because `resolveBaseURL()` falls back to `APP_URL`, then `NEXT_PUBLIC_APP_URL`, then localhost.

- `lib/auth.ts:9-67`
  - Imports `resolveBetterAuthEnvironment()` during module initialization.
  - On validation failure, reports `AUTH_BOOTSTRAP_FAILED` and returns a disabled auth object with `__authOperationalDisabled: true`.

- `app/api/auth/[...all]/route.ts:10-16`
  - If auth is disabled, the route returns HTTP `503` with:
    - `error: "AUTH_BOOTSTRAP_FAILED"`

### GitHub Actions workflow

` .github/workflows/production-deploy.yml`

- `BETTER_AUTH_SECRET` is rendered from:
  - `${{ secrets.BETTER_AUTH_SECRET || secrets.AUTH_SECRET }}`
- The workflow does **not** require `BETTER_AUTH_SECRET` in the required-secret validation list.
- The workflow does export:
  - `APP_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `BETTER_AUTH_SECRET`

### Production secret availability

`gh secret list --env production` shows:

- `GOOGLE_CLIENT_ID` PRESENT
- `GOOGLE_CLIENT_SECRET` PRESENT
- `MONGODB_*` PRESENT
- `POSTGRES_*` PRESENT
- `SSH_*` PRESENT
- `BETTER_AUTH_SECRET` ABSENT
- `AUTH_SECRET` ABSENT

### Live container runtime

Measured inside the active production container:

```json
{
  "BETTER_AUTH_SECRET": [0, 0],
  "AUTH_SECRET": [null, null],
  "NEXTAUTH_SECRET": [null, null],
  "GOOGLE_CLIENT_ID": [72, 72],
  "GOOGLE_CLIENT_SECRET": [35, 35],
  "BETTER_AUTH_URL": [null, null],
  "APP_URL": [35, 35],
  "NEXT_PUBLIC_APP_URL": [35, 35]
}
```

Interpretation:

- `null` = variable not present in the process
- `[0, 0]` = variable present but empty
- `[72, 72]`, `[35, 35]` = variable present and non-empty

## Flow of the variable

1. GitHub Actions renders `.env.production`.
2. The deploy workflow populates `BETTER_AUTH_SECRET` from `secrets.BETTER_AUTH_SECRET || secrets.AUTH_SECRET`.
3. In production, neither secret exists in the GitHub environment list.
4. The resulting runtime env inside the container contains `BETTER_AUTH_SECRET=` empty.
5. `resolveBetterAuthEnvironment()` trims the value, treats it as missing, and throws.
6. `lib/auth.ts` converts that failure into a disabled auth object.
7. `app/api/auth/[...all]/route.ts` returns `503 AUTH_BOOTSTRAP_FAILED`.

## Hypotheses investigated

- Google provider callback issue
- OAuth redirect URI mismatch
- Bad `BETTER_AUTH_URL`
- Database schema failure
- Startup crash in the container
- Traefik routing issue

## Hypotheses discarded

- `BETTER_AUTH_URL` as the root cause
  - Optional fallback exists and the bootstrap failure message specifically names `BETTER_AUTH_SECRET`.
- Missing Google credentials
  - Both Google env values are present in the live container.
- Traefik / reverse proxy issue
  - The API response body and the container logs show the failure originates inside the auth bootstrap path, not in the proxy.
- Docker runtime regression
  - The active production container already has the Docker workdir fix applied.

## Root cause

The production auth bootstrap is resolving `BETTER_AUTH_SECRET` to an empty string, not a usable secret.

The most likely reason is the GitHub environment does not define `BETTER_AUTH_SECRET` or `AUTH_SECRET`, and the workflow fallback:

```yaml
${{ secrets.BETTER_AUTH_SECRET || secrets.AUTH_SECRET }}
```

therefore renders an empty runtime value.

## Required vs optional variables

### Required by the bootstrap

- `BETTER_AUTH_SECRET` or fallback `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Optional for bootstrap URL resolution

- `BETTER_AUTH_URL`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`

## Checklist for future incidents

- [ ] Check `gh secret list --env production` for the auth secret names.
- [ ] Confirm the deployed container env with length-only inspection.
- [ ] Verify `resolveBetterAuthEnvironment()` before investigating providers.
- [ ] Confirm whether the failure is request-time bootstrap, not OAuth callback-time.
- [ ] Confirm `BETTER_AUTH_URL` only after the secret path is valid.
- [ ] Keep `AUTH_BOOTSTRAP_FAILED` and `OAUTH_RUNTIME_ERROR` separate in the report.

## Conclusion

The failure is a configuration and environment propagation issue, not a Google OAuth logic bug and not a Traefik routing bug.

The bootstrap requires a non-empty `BETTER_AUTH_SECRET` or `AUTH_SECRET`. In the live production Node process, `BETTER_AUTH_SECRET` is present but empty, which is enough for the validator to fail and return HTTP `503`.
