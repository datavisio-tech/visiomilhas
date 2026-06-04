# Better Auth Bootstrap Fix

## Problem

The repository had the logical Better Auth schema, but no explicit migration for the physical `ba_*` tables.

## Fix

Add a migration that creates:

- `ba_users`
- `ba_sessions`
- `ba_accounts`
- `ba_verification`

## Outcome

- The bootstrap path for an empty admin database becomes explicit.
- The auth adapter no longer depends on implicit table existence.

## Risk

- The migration still must be executed in the correct order during the actual bootstrap phase.
- This implementation only prepares the migration and documentation; it does not execute anything.
