# Production Bootstrap Discovery

## Summary

This discovery maps the minimum bootstrap required for PostgreSQL Production V2.

## Findings

- The system depends on two production databases:
  - `controle_adm_saas_datavisio`
  - `visiomilhas_app`
- Better Auth depends on the admin-side schema and is not proven to self-bootstrap from an empty database in this repository.
- The operational bootstrap for the first owner, organization, default program/account, and first trial is performed through onboarding and subscription runtime flows, not through demo seeds.

## Required order

1. Provision empty databases.
2. Apply ADM migrations.
3. Apply APP migrations.
4. Ensure Better Auth tables exist.
5. Boot runtime and authenticate first owner.
6. Run onboarding to create organization and default program/account.
7. Activate trial from the Subscribe flow.

## Notes

- Demo seeds are optional and should not be used for real production cutover.
- There is no explicit `workspace` table; the runtime bootstrap uses organization + default program/account as the effective workspace context.
