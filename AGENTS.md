# VisioMilhas Project Operating System

## Official identity

The official AI operating identity for this repository is **IA-1stEngine**.

## Operating discipline

Every operational reply must include, at minimum:

- `AGENT`
- `SKILLS`
- `SOURCES CONSULTED`
- `STATUS`

If any of those fields are missing, the agent must treat the draft as a `PROCESS_VIOLATION`, correct the format internally, and then respond.

Before acting, agents must consult documentation in the official order listed below.
Before declaring `FAIL`, agents must consult the failure registry.
Before declaring `HUMAN_ACTION_REQUIRED`, agents must consult the relevant recovery playbook.

## Official stack

- Next.js App Router
- TypeScript strict
- Drizzle ORM
- Better Auth
- GitHub Actions
- Docker
- Traefik
- Playwright for browser validation

## Multi-tenant / environment strategy

- DEV: localhost, local development and isolated experimentation
- HM: `hm.visiomilhas.visiochat.cloud`, operational homologation and browser validation
- PROD: `visiomilhas.visiochat.cloud`, customer-facing production
- HM and PROD must remain isolated in containers, compose projects, and runtime targets
- QA identities are synthetic, documented, and must never be human or personal accounts

## Official agents

- `autonomous-delivery-engine`
- `failure-recovery-engine`
- `browser-validation`
- `test-orchestration-engine`
- `deployment-runtime-validation`

## Required documentation consultation order

1. `docs/ai-context/`
2. `.agents/`
3. `docs/ai-context/CHANGELOG_AI.md`
4. `docs/ai-context/DECISIONS.md`
5. `docs/ai-context/IMPLEMENTATION_PLAN.md`
6. `docs/ai-context/failure-registry/`

## Recovery and orchestration engines

- `Autonomous Delivery Engine`: implement -> test -> validate -> fix -> retest -> document -> classify -> continue
- `Failure Recovery Engine`: consult registry, apply matching playbook, then fallback before any `FAIL`
- `Test Orchestration Engine`: keep unit, integration, runtime, and browser validation lanes separated
- `Playwright Strategy`: visible browser by default for DEV/HM, headless for PROD, with observability artifacts retained on failure
- `Deployment Runtime Validation`: validate the live stack, not just source changes

## Playwright strategy

- Use visible browser mode by default for DEV and HM
- Use headless mode for PROD
- Keep screenshots, video, and trace on failure
- Use Chromium maximized with human-observable speed
- Load QA users from the official test-user discovery layer before creating or mutating accounts

## Deploy strategy

- `develop` is the official HM branch
- `main` is the official PROD branch
- All writes to Git are done with Git CLI locally
- HM and PROD deployments must use isolated compose names, directories, and runtime targets

## Failure recovery strategy

- Every repeatable operational failure must be registered in the failure registry
- The matching recovery playbook must run before surfacing `FAIL`
- Agent-side or environment-side failures should be reclassified to `WARNING` when appropriate

## Handover strategy

- Every handover must use the standard `DE / PARA / MOTIVO / SKILLS / DOCUMENTOS CONSULTADOS / AÇÃO EXECUTADA / PRÓXIMO PASSO / STATUS` structure
- Handover notes must be concise, factual, and tied to the latest executable state

## HUMAN_ACTION_REQUIRED criteria

Return `HUMAN_ACTION_REQUIRED` only for:

- missing credentials
- explicit business decisions
- destructive operations
- external platform actions that cannot be performed from the current environment

## Documentation update rule

- When implementation changes behavior, update the relevant operational docs and the changelog/decisions/plan records
- Do not create documentation for its own sake; create it when it unlocks execution, validation, or handover
