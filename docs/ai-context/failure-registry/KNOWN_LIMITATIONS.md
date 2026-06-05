# Known Limitations

This registry helps recovery, but it does not remove every possible source of failure.

## Operational limits

- Local execution can still fail before a command starts.
- GitHub API or GitHub App scopes may remain insufficient for write operations.
- SSH may still require an external host key or key rotation correction.
- Release pipeline SSH changes can regress a previously working HM deploy even when host, port, user, and secrets are unchanged; compare against the last successful workflow before classifying the issue as infrastructure.
- HM release promotion currently depends on the explicit approved SSH endpoint `72.60.143.197:22`; masked `SSH_HOST` resolution in the workflow must not replace it until a successful release-promotion run validates the replacement.
- Docker image retention can remove stale images, but active images must remain protected.
- Browser-level validation may require an attached browser tool that is not always available.
- Some sessions may expose no usable Browser/DevTools/Playwright runtime even when the SaaS is healthy; in that case use HTTP/runtime checks instead.
- Playwright can be available while still requiring its own isolated smoke-test lane separate from Vitest or unit-test execution.

## What this registry does not solve

- Missing human credentials or revoked secrets
- Production-side outages unrelated to the HM stack
- Destructive user decisions outside the approved architecture
- External SaaS regressions in OAuth providers or registries
