# Failure Recovery Engine

Use this skill whenever an agent is about to return `FAIL`, or when a repeated operational issue is blocking progress.

## Goal

Convert recoverable failures into:
- a targeted fix,
- a fallback,
- or a justified `WARNING`.

## Required flow before `FAIL`

1. Consult `docs/ai-context/failure-registry/FAILURE_REGISTRY.md`.
2. Match the observed symptom against `FAILURE_PATTERNS.md`.
3. Run the matching playbook from `RECOVERY_PLAYBOOKS.md`.
4. Try the documented fallback.
5. Reclassify to `WARNING` when the failure is caused by the agent, local runtime, or integration gap rather than the SaaS.
6. Return `FAIL` only if the issue persists and materially blocks delivery.

## Known patterns

- `spawn setup refresh`
- `403 Resource not accessible by integration`
- `Permission denied (publickey,password)`
- `Bad port`
- `pull access denied`
- `container name conflict`

## Operational rule

Do not stop at the first failure if a registry-backed recovery is available.

## Output discipline

When a failure is recoverable, report:
- the observed pattern,
- the playbook used,
- the fallback attempted,
- the new status (`WARNING` or `PASS`).
