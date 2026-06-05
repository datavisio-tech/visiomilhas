# Agent Router

This file is the mandatory routing layer for VisioMilhas operational tasks.

Before any execution, identify the task type, consult this router, then select the agent and required skills.

## Routing table

| TIPO_DE_TAREFA | AGENTE | SKILLS |
|---|---|---|
| Deploy | `024-deployment.agent.md` | `deployment-runtime-validation`, `failure-recovery-engine` |
| Release | `024-deployment.agent.md` | `deployment-runtime-validation`, `failure-recovery-engine` |
| Promotion | `024-deployment.agent.md` | `deployment-runtime-validation`, `failure-recovery-engine` |
| Cutover | `024-deployment.agent.md` | `deployment-runtime-validation`, `failure-recovery-engine` |
| Browser | `021-automated-testing.agent.md` | `browser-validation`, `failure-recovery-engine` |
| Playwright | `021-automated-testing.agent.md` | `browser-validation`, `failure-recovery-engine` |
| Testing | `020-test-architecture.agent.md` | `test-orchestration-engine`, `browser-validation` |
| Failure | `028-governance.agent.md` | `failure-recovery-engine`, `ia-first-engine-discipline` |
| Refactoring | `001-ia1st-orchestrator.agent.md` | `autonomous-delivery-engine`, `failure-recovery-engine` |
| Documentation | `028-governance.agent.md` | `ia-first-engine-discipline` |
| Governance | `028-governance.agent.md` | `ia-first-engine-discipline` |

## Mandatory routing rule

1. Identify the task type.
2. Consult this router.
3. Select the agent file from `.github/agents/`.
4. Select the required skills from `.agents/skills/`.
5. Execute.

## Prohibited replies

Do not reply with generic agent identities such as:

- `IA-1stEngine / Generic Agent`
- `Custom Auditor`

Every operational reply must be rooted in a routed agent from `.github/agents/`.

## Document precedence

1. `~/.codex/AGENTS.md`
2. `AGENTS.override.md`
3. `AGENTS.md`
4. `.agents/AGENT_ROUTER.md`
5. `.github/agents/`
6. `.agents/*`
7. `docs/ai-context/*`
