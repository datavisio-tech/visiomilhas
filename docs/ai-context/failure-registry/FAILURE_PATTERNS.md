# Failure Patterns

This file explains how to recognize the failure classes in the registry.

## `spawn setup refresh`

Symptoms:
- local command execution fails before the command body runs
- `exec_command` or equivalent process spawning aborts
- browser or shell helpers stop creating new processes

Likely cause:
- environment bootstrap bug in the Codex host

Recovery:
- retry once after resetting the local execution context
- prefer read-only validation if the runtime is temporarily unstable

## `403 Resource not accessible by integration`

Symptoms:
- GitHub API or connector write operation fails immediately
- branch creation, file creation, or workflow update is denied

Likely cause:
- token/app scope mismatch

Recovery:
- switch to Git CLI local when available
- verify branch/repo permissions
- use a user-owned token or authorized integration only if writing through GitHub API is unavoidable

## `Permission denied (publickey,password)`

Symptoms:
- SSH connects but authentication fails

Likely cause:
- wrong key, wrong user, wrong host, stale authorized key, or wrong SSH port

Recovery:
- validate `SSH_HOST`, `SSH_PORT`, `SSH_USER`
- rotate or replace `SSH_PRIVATE_KEY`
- retry with fallback port `22` when appropriate

## `Bad port`

Symptoms:
- SSH or workflow parsing reports invalid port

Likely cause:
- secret interpolation bug or malformed port value

Recovery:
- persist a known-good port value
- default to `22` for SSH if the environment does not provide a valid value

## `pull access denied`

Symptoms:
- Docker tries to pull an image that is not published or not accessible

Likely cause:
- workflow expects a registry image that does not exist or requires login

Recovery:
- build locally on the target host
- tag the local image with the current SHA
- point compose to the locally built image

## `container name conflict`

Symptoms:
- Docker refuses to create the HM container because a different environment already uses the same name

Likely cause:
- HM and PROD share `container_name` or `COMPOSE_PROJECT_NAME`

Recovery:
- isolate HM container and compose project names
- keep Traefik on the shared public network only

## `browser unavailable`

Symptoms:
- no browser automation tool is callable
- Playwright/Chromium is not exposed
- process spawning fails before the browser can start

Likely cause:
- local runtime limitation or missing browser automation connector

Recovery:
- fall back to HTTP/runtime validation
- use non-browser checks for auth bootstrap, redirects, and route rendering
- keep the issue classified as `WARNING` when the SaaS remains healthy

## `playwright runtime drift`

Symptoms:
- Playwright is installed and runnable, but the test suite behaves inconsistently when mixed with Vitest or other runners
- browser tests need explicit isolation, ports, or environment variables

Likely cause:
- shared test config, mixed runners, or missing Playwright-specific setup conventions

Recovery:
- isolate Playwright specs from unit tests
- use a dedicated smoke-test folder
- keep browser automation configuration explicit and deterministic
