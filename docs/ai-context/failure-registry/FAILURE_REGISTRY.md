# Failure Registry

Last updated: 2026-06-05

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
| `browserType.launch: Executable doesn't exist` | Playwright runtime / CI preparation | The workflow installed Playwright dependencies but not the browser binary expected by the smoke job | `WARNING` when adding an explicit browser-install step restores the lane; otherwise `FAIL` if the runner cannot provision browsers |
| `ssh timeout after release workflow change` | Release pipeline / SSH preparation | Release workflow diverged from the last known-good HM SSH bootstrap, including selected-port `ssh-keyscan` retry behavior, then timed out at the first remote command | `PIPELINE_REGRESSION`; restore the last known-good selected-port SSH bootstrap before investigating host infrastructure |
| `SSH_DEPLOY_TIMEOUT_RELEASE_PROMOTION` | Release pipeline / SSH endpoint resolution | HM release promotion used masked/inconsistent `SSH_HOST` resolution while the operational HM SSH endpoint was known and reachable | `PIPELINE_REGRESSION`; pin HM release promotion to the approved SSH endpoint and port, then rerun |

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
  - HM workflow correction: when `SSH_HOST` resolution inside release promotion remains masked or inconsistent, set the HM release job to the approved operational SSH endpoint `72.60.143.197` and port `22`.
  - Recurrence prevention: compare SSH authentication blocks before modifying release promotion deploy jobs.
- `SSH_DEPLOY_TIMEOUT_RELEASE_PROMOTION`: HM release promotion SSH timeout.
  - Context: release promotion replaced the old independent HM deploy path as the official RC promotion workflow.
  - Symptoms: `Configure SSH` in `.github/workflows/release-promotion.yml` repeatedly timed out during `ssh-keyscan` and SSH authentication; earlier runs stopped before `Ensure remote directory exists`.
  - RCA: the regression was in `.github/workflows/release-promotion.yml`; HM promotion depended on masked/inconsistent `SSH_HOST` resolution from the GitHub Environment while the approved operational SSH endpoint was already known. The functional path required explicit HM endpoint `72.60.143.197`, port `22`, the same private-key file path, `chmod 600`, selected-port persistence, and the same `ssh -i`/`scp -i` usage pattern as the baseline.
  - Not root cause: `SSH_PRIVATE_KEY` and `SSH_USER`; after endpoint correction, the same key and `root` user authenticated and later deploy steps passed.
  - Related factors: `SSH_HOST`, `SSH_PORT`, `ssh-keyscan`, `known_hosts`, GitHub Environment resolution, and `.github/workflows/release-promotion.yml`.
  - Correction: commit `12aa01b` set HM release promotion to `SSH_HOST=72.60.143.197` and `SSH_PORT=22`; earlier commits `57de73a` and `2a79fbd` restored SSH preparation/authentication parity with `deploy-hm.yml`.
  - Validation: GitHub Actions run `26986661630` passed `Configure SSH`, `Ensure remote directory exists`, `Sync source to HM server`, `Load release image on HM host`, `Render HM env on server`, and `Deploy release artifact to HM`.
  - Lessons learned: release promotion workflows must not rely on a masked environment value when the approved operational endpoint is known and already validated by the legacy HM deploy.
  - Prevention: keep HM SSH endpoint and port explicit in the release promotion HM job until a replacement is validated by a successful release-promotion run.
- `FP-011`: Playwright browser binary missing in HM smoke.
  - Classification: `PIPELINE_REGRESSION`.
  - Symptom: `Playwright smoke on HM` reached `npx playwright test --config=playwright.config.ts`, then failed with `browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/.../chrome-headless-shell`.
  - Affected workflow: `.github/workflows/release-promotion.yml`.
  - Root cause: the HM smoke job installed Node dependencies but not the Playwright browser binary required by Chromium smoke tests.
  - Recovery: insert an explicit `npx playwright install --with-deps chromium` step before `npx playwright test` in the HM smoke job.
  - Recurrence prevention: every browser-validation job must provision the browser executable explicitly instead of assuming `npm ci` is enough.
