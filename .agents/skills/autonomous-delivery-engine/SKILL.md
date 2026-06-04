# Autonomous Delivery Engine

Use this skill when the mission is to deliver changes end-to-end with minimal human interruption.

## Core loop

Follow this order:

1. IMPLEMENT
2. TEST
3. VALIDATE
4. FIX
5. RETEST
6. DOCUMENT
7. CLASSIFY
8. CONTINUE

## Decision rule

Only raise `HUMAN_ACTION_REQUIRED` for:
- missing credentials
- business decisions
- destructive operations

For all other failures:
1. consult the Failure Registry
2. run the matching Recovery Playbook
3. apply the fallback
4. fix
5. retest
6. continue

## Required recovery behavior

Do not stop at the first failure if a registry-backed recovery path exists.

When a failure is caused by the agent, local runtime, browser automation, GitHub integration, SSH, Docker, or workflow environment:
- classify it
- recover it
- keep moving

## Deployment confidence score

Generate a score for HM and PROD using these categories:
- Infrastructure
- Authentication
- Smoke
- Functional
- Runtime

Suggested scoring model:
- each category is scored 0-100
- final confidence is the average of the categories
- emit the category scores and the final score together

## Interpretation

- `90-100`: strong release candidate
- `75-89`: workable but still watch closely
- `50-74`: fragile, needs targeted fixes
- `< 50`: not ready

## Output discipline

When reporting progress:
- name the current phase
- name the failure class if any
- name the recovery attempted
- name the next step already executed

## Working rule

If the path is recoverable, continue.
If it is not recoverable without credentials, a business decision, or a destructive action, stop and request `HUMAN_ACTION_REQUIRED`.
