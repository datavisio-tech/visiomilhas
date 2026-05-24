# AI Skills - VisioMilhas

Esta pasta organiza skills reutilizaveis para o fluxo IA-First do projeto.

Versao da camada:

- `SKILLS_LAYER_VERSION=v1`
- `COMPATIBLE_WITH=AI_OPERATING_MODEL_VERSION=2.2-I`

Matriz de compatibilidade:

| Layer | Version | Compatible With | Status | Baseline ativa |
| --- | --- | --- | --- | --- |
| AI Operating Model | 2.2-I | Skills v1, Agents v1 | active | yes |
| Skills Layer | v1 | AI-OM 2.2-I | active | yes |
| Agents Layer | v1 | AI-OM 2.2-I | active | yes |
| Auth Governance | 2.2-G | Recovery v1 | active | yes |
| Ownership Model | 2.2-C | AI-OM 2.2-I | active | yes |

Regras de drift:

- bump de versao quando contrato, baseline ou compatibilidade mudar;
- sincronizar skills e agents quando specs mudarem;
- registrar incompatibilidades em `CHANGELOG_AI.md` e `DAILY_CHECKPOINT.md`.

Hierarquia:

- `docs/ai-context` e `docs/specs` definem o que e verdade.
- `docs/ai-skills` descreve especializacoes operacionais que executam esse contexto.
- `.claude/skills` e `.github/agents` devem apontar para esta base e nunca criar uma arquitetura paralela.

Skills alvo:

- backend-api.md
- frontend-ui.md
- auth-security.md
- multi-tenant.md
- database-patterns.md
- code-style.md
- testing.md
- deploy-devops.md
- observability.md
- documentation.md

Regras:

- Skills devem ser pequenas, objetivas e revisaveis.
- Cada skill precisa responder quando usar, quando nao usar e qual a saida esperada.
- Cada skill deve carregar metadados de versao e compatibilidade simples.
