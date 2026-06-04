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

## Playbook: `ssh timeout after accept-new`

1. Compare the failing workflow with the last successful deploy workflow before changing infrastructure.
2. If the failing workflow replaced `ssh-keyscan` with `StrictHostKeyChecking accept-new`, classify the incident as `PIPELINE_REGRESSION`.
3. Restore the proven baseline:
   - write `SSH_PRIVATE_KEY` to `~/.ssh/visiomilhas_deploy_key`
   - run `ssh-keyscan -T 10 -p "${SSH_PORT}" "${SSH_HOST}" >> ~/.ssh/known_hosts`
   - when `${SSH_PORT}` is not `22`, also run `ssh-keyscan -T 10 -p 22 "${SSH_HOST}" >> ~/.ssh/known_hosts || true`
   - persist `SSH_PORT=${SSH_PORT}` to `$GITHUB_ENV`
4. Re-run the release promotion workflow for the same release tag.
5. Only investigate firewall, host availability, or secrets after the restored baseline fails again.

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
