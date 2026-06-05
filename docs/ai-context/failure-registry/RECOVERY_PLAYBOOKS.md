# Recovery Playbooks

## Playbook: `spawn setup refresh`

1. Reset the local execution context.
2. Retry a minimal command.
3. If the host remains unstable, switch to the most direct existing evidence path.
4. Reclassify the issue as runtime instability if the app itself is still healthy.

## Playbook: `403 Resource not accessible by integration`

1. Try Git CLI local for write operations.
2. Verify that the branch exists and the repo is writable.
3. Confirm the integration has the correct scopes.
4. If GitHub API remains blocked, use a user-authorized token or local Git publishing.

## Playbook: `Permission denied (publickey,password)`

1. Verify `SSH_HOST`, `SSH_PORT`, `SSH_USER`.
2. Re-check `SSH_PRIVATE_KEY`.
3. Test the fallback port `22`.
4. Ensure the target user exists and the authorized key is installed.

## Playbook: `Bad port`

1. Persist a known-good port value.
2. Avoid re-overwriting the port later in the workflow.
3. Re-run SSH validation.

## Playbook: `ssh timeout after release workflow change`

1. Compare the failing workflow with the last successful deploy workflow before changing infrastructure.
2. If host, user, port, and secrets are unchanged but the release workflow changed the SSH bootstrap, classify the incident as `PIPELINE_REGRESSION`.
3. Restore the proven baseline from `.github/workflows/deploy-hm.yml`:
   - write `SSH_PRIVATE_KEY` to `~/.ssh/visiomilhas_deploy_key`
   - set `chmod 600 ~/.ssh/visiomilhas_deploy_key`
   - run the selected-port `ssh-keyscan` retry loop for `${SSH_PORT}` and `22`
   - fail fast if neither port captures the host key
   - persist `SSH_PORT=${selected_port}` to `$GITHUB_ENV`
   - keep `Configure SSH` step-level env declarations for `SSH_HOST`, `SSH_PORT`, and `SSH_PRIVATE_KEY`
   - keep `SSH_USER` available in `Configure SSH` when the workflow validates authentication during SSH preparation
   - keep remote preparation step-level env declarations for `SSH_HOST` and `SSH_USER`
4. If `ssh-keyscan` does not populate `known_hosts`, run a real SSH authentication validation with the same key and `StrictHostKeyChecking=accept-new`; do not create `~/.ssh/config`.
5. For HM release promotion, if the masked `SSH_HOST` value remains inconsistent, use the approved operational endpoint `72.60.143.197` with port `22`.
6. Re-run the release promotion workflow for the same release tag.
7. Only inspect SSH authentication differences after the restored baseline fails again.

## Playbook: `SSH_DEPLOY_TIMEOUT_RELEASE_PROMOTION`

1. Confirm the failure is in `.github/workflows/release-promotion.yml`, job `Deploy promoted release to HM`, step `Configure SSH`.
2. Do not reopen DNS, firewall, or host-availability RCA when the server is already confirmed online.
3. Check the SSH deployment inputs in this order:
   - `SSH_HOST`
   - `SSH_PORT`
   - `SSH_USER`
   - `SSH_PRIVATE_KEY`
   - private-key materialization path
   - `chmod 600`
   - `known_hosts`
   - `ssh-keyscan`
   - `ssh -i` and `scp -i`
4. For HM release promotion, use the approved operational endpoint:
   - `SSH_HOST=72.60.143.197`
   - `SSH_PORT=22`
   - `SSH_USER=root`
5. Keep the baseline authentication behavior:
   - write `SSH_PRIVATE_KEY` to `~/.ssh/visiomilhas_deploy_key`
   - set `chmod 600 ~/.ssh/visiomilhas_deploy_key`
   - attempt `ssh-keyscan`
   - persist the selected port into `$GITHUB_ENV`
   - use `ssh -i ~/.ssh/visiomilhas_deploy_key`
   - use `scp -i ~/.ssh/visiomilhas_deploy_key`
6. Validate recovery by rerunning release promotion for the same RC tag.
7. Recovery is confirmed when the run passes:
   - `Configure SSH`
   - `Ensure remote directory exists`
   - `Sync source to HM server`
   - `Load release image on HM host`
   - `Render HM env on server`
   - `Deploy release artifact to HM`
8. If a later step fails after those steps pass, classify it as a new non-SSH runtime/deploy validation issue.

## Playbook: `pull access denied`

1. Stop relying on remote image pull for HM.
2. Build the image on the target host.
3. Tag it with the current SHA.
4. Start the container from the local image.

## Playbook: `container name conflict`

1. Stop the old containers safely.
2. Remove the conflicting container.
3. Separate HM and PROD `container_name` and `COMPOSE_PROJECT_NAME`.
4. Re-deploy HM with isolated names.

## Playbook: `browser unavailable`

1. Confirm that no browser/DevTools tool is available.
2. Confirm whether local process spawning is failing.
3. Switch to HTTP-level validation for route, auth bootstrap, and session endpoints.
4. Continue the mission and only escalate if no fallback path exists.

## Playbook: `playwright runtime drift`

1. Separate Playwright smoke tests from Vitest/unit tests.
2. Put browser checks in a dedicated Playwright folder or naming convention.
3. Keep the base URL explicit and avoid shared test bootstraps.
4. Run the browser suite independently from unit tests.

## Playbook: `browserType.launch: Executable doesn't exist`

1. Confirm the workflow installed Node dependencies but not the browser binary.
2. Add an explicit `npx playwright install --with-deps chromium` step before `npx playwright test`.
3. Keep the browser-install step in the same job that runs the browser smoke tests.
4. Re-run the workflow and verify that the browser launch error disappears.

## Playbook: `PRECHECK_INFRASTRUCTURE failed`

1. Stop the workflow immediately.
2. Do not start build, deploy, or smoke stages until the target passes the precheck.
3. Capture and preserve the evidence block emitted by the gate:
   - `timestamp_utc`
   - `runner_name`
   - `runner_os`
   - `runner_arch`
   - `runner_labels`
   - `runner_public_ip`
   - `ssh_host`
   - `ssh_port`
   - `github_run_id`
   - `github_job`
   - `github_workflow`
4. Check the failed item in order:
   - DNS or host resolution for the target
   - `ssh-keyscan` retry on `${SSH_PORT}` and `22`
   - fallback SSH handshake with `StrictHostKeyChecking=accept-new`
   - SSH handshake
   - remote directory existence and writability
   - free disk space on the target
   - Docker and Docker Compose availability on the target
5. Use the runner public IP and timestamp to distinguish runner-to-VPS path variance from VPS-side or configuration failures.
6. Fix the target readiness issue outside the workflow only when the evidence points to target-side readiness.
7. Re-run the same workflow only after the evidence-backed issue is addressed.

## Playbook: `intermittent runner SSH timeout`

1. Confirm the server-side SSH service is active and port 22 is listening.
2. Confirm `fail2ban-client` is absent or that `sshd` is not banned.
3. Confirm the host firewall is not blocking SSH.
4. Check the effective `sshd` limits with `sshd -T`, especially `maxstartups` and `maxsessions`.
5. Correlate the failing run timestamp with `journalctl -u ssh` on the target.
6. If the server logs show successful `Accepted publickey` sessions in the same window, treat the failure as runner-path or negotiation variance, not host downtime.
7. Require the `PRECHECK_INFRASTRUCTURE failure evidence` block before opening a new SSH RCA.
8. Re-run the workflow from a fresh runner and preserve the precheck gate before opening a host-level RCA.

## Playbook: `release-promotion SSH retry amplification`

1. Treat repeated port probes and remote setup SSH calls as workflow amplification, not as a new host failure class.
2. Deduplicate the SSH port list so `${SSH_PORT}` and `22` are only probed once each.
3. Keep exponential backoff on `ssh-keyscan` and SSH handshake retries, but cap the retry budget so the workflow still fails fast.
4. Remove standalone remote-directory SSH calls from the promotion workflow; let `rsync` create the directory and let the remote orchestration script own target-side setup.
5. Keep the release-promotion path to one precheck gate, one sync transport, one image stage, one env stage, and one remote orchestration session per environment.
6. Re-run the release promotion workflow after the SSH path is compacted.
