# Better Auth Audit

## What exists in the repository

- `lib/server/better-auth-config.ts` resolves the runtime environment.
- `lib/auth.ts` initializes Better Auth with the resolved environment.
- `lib/server/better-auth-schema.ts` defines the physical `ba_*` relations expected by the Drizzle adapter.
- `app/api/auth/[...all]/route.ts` converts bootstrap/runtime failures into controlled `503` responses.

## Where the Better Auth tables come from

- The repository contains the table definitions in `lib/server/better-auth-schema.ts`.
- I did **not** find a dedicated migration file that creates those `ba_*` tables.
- I did **not** find evidence of automatic table creation in the repo for an empty database.

## Bootstrap conclusion

- Better Auth is **not** safe to assume as self-bootstrapping on a truly empty admin database.
- For an empty production database, the auth schema must exist before the runtime can persist sessions and accounts.

## Empty database risk

- If the admin database is empty and the `ba_*` tables are missing, the auth route can fail with:
  - `AUTH_BOOTSTRAP_FAILED`
  - `AUTH_DB_TABLE_MISSING`
- The route handler is intentionally defensive and turns bootstrap failures into `503` responses.

## Required environment

- `BETTER_AUTH_SECRET` (with `AUTH_SECRET` as legacy fallback only)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL` or `NEXT_PUBLIC_APP_URL` for base URL fallback
- `BETTER_AUTH_URL` is optional

## Decision

- Better Auth requires a provisioning/bootstrap step before an empty production database can be treated as ready.
- The repo does not provide proof of automatic schema creation for the `ba_*` tables.
