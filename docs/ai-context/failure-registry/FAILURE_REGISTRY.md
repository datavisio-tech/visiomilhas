# Failure Registry

Last updated: 2026-06-04

This registry tracks recurring operational failures so agents can recover before surfacing `FAIL`.

## Known failure classes

| Pattern | Likely layer | Typical cause | Default disposition |
|---|---|---|---|
| `spawn setup refresh` | Local execution environment | Shell/runtime bootstrap failure in the Codex host | `WARNING` if app is healthy; `FAIL` only if the same issue repeats after recovery attempts |
| `403 Resource not accessible by integration` | GitHub integration / permissions | GitHub App or token lacks write scope for the target resource | `WARNING` when a local Git CLI fallback is available; otherwise `FAIL` |
| `Permission denied (publickey,password)` | SSH / remote access | Wrong SSH key, wrong user, wrong host, or stale authorized_keys | `WARNING` if key rotation or port fallback can recover; otherwise `FAIL` |
| `Bad port` | SSH / workflow env | Malformed port value or port interpolation bug | `WARNING` after fallback to `22`; `FAIL` if the workflow still cannot connect |
| `pull access denied` | Docker image / registry | Workflow points to a registry image that is not published or not authenticated | `WARNING` if local build or image isolation can recover; otherwise `FAIL` |
| `container name conflict` | Docker compose / host state | HM and PROD share a container name or project name | `WARNING` after isolation fix; `FAIL` if old containers cannot be removed safely |
| `browser unavailable` | Browser automation / local runtime | No usable browser/DevTools/Playwright runtime is exposed, or the local process host cannot spawn browser helpers | `WARNING` if HTTP/runtime validation can continue; `FAIL` only if no fallback path exists |
| `playwright runtime drift` | Test automation / local runtime | Playwright is available, but the environment requires isolation from unit test runners and explicit setup conventions | `WARNING` when the setup can be standardized; otherwise `FAIL` only if automation cannot be stabilized |
| `ssh timeout after release workflow change` | Release pipeline / SSH preparation | Release workflow diverged from the last known-good HM SSH bootstrap, including selected-port `ssh-keyscan` retry behavior, then timed out at the first remote command | `PIPELINE_REGRESSION`; restore the last known-good selected-port SSH bootstrap before investigating host infrastructure |

## Recovery rule

Before an agent returns `FAIL`, it must:

1. Search this registry for a matching pattern.
2. Apply the relevant recovery playbook.
3. Try the documented fallback.
4. Reclassify the issue as `WARNING` when the failure is caused by the agent/runtime or integration gap rather than the SaaS itself.

If the failure persists after recovery and directly blocks delivery, the agent may return `FAIL` with a concrete root cause.

## Operational findings

- `FP-008`: Playwright runtime confirmed with `npx playwright test --config=playwright.config.ts` returning `1 passed`.
- Browser smoke tests should be treated as a separate lane from Vitest and should not inherit unit-test bootstrapping.
- `FP-009`: Release promotion SSH regression.
  - Classification: `PIPELINE_REGRESSION`.
  - Symptom: `release-promotion.yml` failed in `Deploy promoted release to HM` at `Ensure remote directory exists` with `ssh: connect to host *** port ***: Connection timed out`.
  - Affected workflow: `.github/workflows/release-promotion.yml`.
  - Root cause: regression introduced by the release promotion pipeline SSH preparation, not an application deploy failure.
  - Recovery: restore the last successful `.github/workflows/deploy-hm.yml` SSH bootstrap: create `~/.ssh`, write `~/.ssh/visiomilhas_deploy_key`, run the selected-port `ssh-keyscan` retry loop across `${SSH_PORT}` and `22`, and persist `SSH_PORT=${selected_port}` to `$GITHUB_ENV`.
  - Recurrence prevention: release promotion deploy jobs must not diverge from the proven HM SSH bootstrap unless a successful release-promotion run validates the replacement.
- `FP-010`: Release promotion SSH authentication parity.
  - Classification: `PIPELINE_REGRESSION`.
  - Symptom: release promotion reached the SSH layer but failed before remote preparation while the HM baseline workflow already authenticated successfully.
  - Affected workflow: `.github/workflows/release-promotion.yml`.
  - Root cause: release promotion SSH steps were not fully aligned with the proven `.github/workflows/deploy-hm.yml` authentication baseline.
  - Recovery: keep the same private-key materialization path, permissions, `known_hosts` generation, selected-port persistence, and step-level SSH env declarations used by `deploy-hm.yml`; if `ssh-keyscan` does not materialize `known_hosts`, validate SSH authentication with the same private key and `StrictHostKeyChecking=accept-new` without introducing `~/.ssh/config`.
  - Recurrence prevention: compare SSH authentication blocks before modifying release promotion deploy jobs.
