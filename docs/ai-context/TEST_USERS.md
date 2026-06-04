# TEST USERS

This file is the official discovery layer for browser automation users.

Source of truth:
- `docs/testing/AUTH_TEST_USERS.md`

Rules:
- Do not use human accounts.
- Do not use personal accounts.
- Do not create new test users unless no adequate QA user exists.
- Prefer stable synthetic users already present in the repository.

Mapped QA roles:

| Role | Email | Password | Intended use |
| --- | --- | --- | --- |
| `QA_OWNER` | `emailteste01@teste.com` | `emailteste01` | owner onboarding and privileged flows |
| `QA_ACTIVE` | `emailteste02@teste.com` | `emailteste02` | active subscription and signed-in flows |
| `QA_TRIAL` | `emailteste03@teste.com` | `emailteste03` | trial and subscribe validation |
| `QA_EXPIRED` | `emailteste04@teste.com` | `emailteste04` | expired access and recovery flows |
| `QA_NEW` | `emailteste05@teste.com` | `emailteste05` | first-time onboarding and signup flows |

Browser automation should load the role mapping from this file first and only fall back to the legacy docs if needed.
