# ai-agents.spec

Status: draft

Objetivo:

- Definir o papel dos agentes da stack IA-First operacional e sua relacao com auth/ownership.

Estado atual:

- Existem poucos agents formais no workspace e eles devem seguir a hierarquia de conhecimento oficial definida em `AI_OPERATING_MODEL.md`.
- A camada operacional de agents nao define arquitetura, auth, ownership ou deploy; ela apenas coordena execucao com base nos docs oficiais.
- A fase 2.2-J adiciona versionamento textual simples para agents e compatibilidade com `AI_OPERATING_MODEL_VERSION=2.2-I`.

Decisao alvo:

- Poucos agentes, cada um com responsabilidade clara.
- Usar agentes para diagnostico, implementacao, seguranca e documentacao.
- Um agente de seguranca deve revisar boundaries de auth/ownership.
- Um agente de infraestrutura deve manter continuidade sobre deploy, Swarm, Traefik e rollback.
- Todo agent deve registrar checkpoint, validar a mudanca e apontar para specs oficiais quando usar skills.
- Cada agent deve declarar `AGENT_VERSION` e `REQUIRES_OPERATING_MODEL`.

Riscos:

- Excesso de agentes e duplicacao de funcoes.
- Drift entre agents, skills e docs quando uma camada tentar redefinir uma decisao ja consolidada.
- Agents desatualizados ou sem metadado de compatibilidade podem operar fora da baseline oficial.

Proximo passo:

- Manter apenas os agents que reduzirem retrabalho de forma objetiva e atualizar seus contratos sempre que `docs/specs` ou `docs/ai-context` mudarem.
- Revalidar a compatibilidade dos agents quando o operating model ou as baselines de auth, ownership ou recovery mudarem.
