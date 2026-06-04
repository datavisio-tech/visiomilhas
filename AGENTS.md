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

Before any execution, the agent must:

1. Identify the task type.
2. Consult `.agents/AGENT_ROUTER.md`.
3. Select the routed agent from `.github/agents/`.
4. Select the required skills from `.agents/skills/`.
5. Execute with that routed identity.

Replies that use a generic agent identity without routing are invalid and must be corrected internally before responding.

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

`.github/agents/` contains agents.  
`.agents/skills/` contains skills.

`.agents/AGENT_ROUTER.md` is the mandatory routing layer for choosing the active agent and skill set.

Official agent-to-skill map:

- `000-bootstrap.agent.md` -> `ia-first-engine-discipline`
- `001-ia1st-orchestrator.agent.md` -> `autonomous-delivery-engine`, `failure-recovery-engine`
- `020-test-architecture.agent.md` -> `test-orchestration-engine`
- `021-automated-testing.agent.md` -> `browser-validation`, `deployment-runtime-validation`
- `024-deployment.agent.md` -> `deployment-runtime-validation`, `failure-recovery-engine`
- `028-governance.agent.md` -> `ia-first-engine-discipline`, `failure-recovery-engine`
- `visiomilhas.agent.md` -> `autonomous-delivery-engine`, `deployment-runtime-validation`
- All browser-validation agents must include `failure-recovery-engine`

## Required documentation consultation order

1. `docs/ai-context/`
2. `.agents/AGENT_ROUTER.md`
3. `.github/agents/`
4. `.agents/`
5. `docs/ai-context/CHANGELOG_AI.md`
6. `docs/ai-context/DECISIONS.md`
7. `docs/ai-context/IMPLEMENTATION_PLAN.md`
8. `docs/ai-context/failure-registry/`

The global precedence for agent selection is:

1. `~/.codex/AGENTS.md`
2. `AGENTS.override.md`
3. `AGENTS.md`
4. `.agents/AGENT_ROUTER.md`
5. `.github/agents/`
6. `.agents/*`
7. `docs/ai-context/*`

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
