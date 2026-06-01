# AI Operating Model - DataVisio / VisioMilhas

Este documento consolida o modelo operacional IA-First da DataVisio para o VisioMilhas e para futuros SaaS do ecossistema. Ele define como a IA entra no fluxo de trabalho, quais artefatos orientam cada decisão e onde a automação deve parar para preservar simplicidade, custo baixo e governança sustentável.

AI_OPERATING_MODEL_VERSION=2.2-I
BASELINE_STATUS=active
BASELINE_CONSOLIDATED_AT=2026-05-24

## Princípios

- A IA aqui é uma camada operacional de engenharia, não um substituto da revisão humana.
- O sistema deve ser útil com pouco contexto, mas nunca operar sem contexto.
- O modelo prioriza contexto persistente, tarefas pequenas, validação explícita e documentação atualizada.
- A meta é reduzir retrabalho e improviso, não multiplicar abstrações.
- Se uma decisão aumenta risco operacional, ela sai do fluxo automático e volta para revisão humana.

## Hierarquia de conhecimento

A governanca IA-First do VisioMilhas usa a seguinte hierarquia oficial:

- Fonte de verdade estratégica: `docs/ai-context`, `docs/specs` e `docs/ai-skills`.
- Camada operacional IA: `.claude/skills` e `.github/agents`.

Responsabilidades por camada:

- `docs/ai-context` registra contexto persistente, decisões, plano, changelog e checkpoints.
- `docs/specs` registra contratos, boundaries, estados operacionais e próximos passos.
- `docs/ai-skills` descreve especializações reutilizáveis que operacionalizam os specs oficiais.
- `.claude/skills` executa heurísticas locais e deve apontar para os specs oficiais, sem redefinir arquitetura, auth, ownership ou deploy.
- `.github/agents` orquestra tarefas multi-etapas e deve seguir o mesmo boundary model dos docs.

Nenhuma skill ou agent pode virar fonte paralela de arquitetura.

## Versionamento oficial

O versionamento da governanca IA é propositalmente simples e auditável.

Camadas versionadas:

- Operating Model Version: `2.2-I`
- Skills Layer Version: `v1`
- Agents Layer Version: `v1`
- Auth Governance Version: `2.2-G`
- Recovery Model Version: `2.2-G`
- Ownership Model Version: `2.2-C`

Baseline operacional ativa:

- IA baseline: `2.2-I`
- auth baseline: `2.2-G`
- ownership baseline: `2.2-C`
- observability baseline: `2.2-G`
- deployment governance baseline: `1.3.32`

Compatibilidade esperada:

- skills v1 devem ser compatíveis com `AI_OPERATING_MODEL_VERSION=2.2-I`
- agents v1 devem requerer no mínimo `2.2-I`
- auth/ownership/recovery precisam permanecer compatíveis com as baselines registradas acima

Compatibilidade mínima documentada:

| Layer | Version | Compatible With | Status | Baseline ativa |
| --- | --- | --- | --- | --- |
| AI Operating Model | 2.2-I | Skills v1, Agents v1 | active | yes |
| Skills Layer | v1 | AI-OM 2.2-I | active | yes |
| Agents Layer | v1 | AI-OM 2.2-I | active | yes |
| Auth Governance | 2.2-G | Recovery v1 | active | yes |
| Recovery Model | 2.2-G | AI-OM 2.2-I | active | yes |
| Ownership Model | 2.2-C | AI-OM 2.2-I | active | yes |

Drift rules:

- bump de versão é obrigatório quando um doc muda contrato, boundary, baseline ou compatibilidade esperada;
- specs exigem sync quando alteram auth, ownership, recovery, deploy, permissões ou agentes;
- skills ficam incompatíveis quando o contrato oficial muda e a skill continua descrevendo comportamento antigo;
- agents precisam de atualização quando o fluxo operacional mudar ou quando a skill que ele orquestra mudar de contrato;
- breaking governance changes devem ser registradas em `CHANGELOG_AI.md` antes de qualquer mudança operacional adicional.

## Fontes de verdade

O conjunto abaixo é a memória persistente do projeto e deve ser consultado antes de qualquer decisão relevante:

- `PROJECT_CONTEXT.md` para escopo, produto, público, stack e restrições de alto nível.
- `ARCHITECTURE.md` para boundaries, modelo de execução, tenancy, deploy e segurança.
- `docs/specs` para contratos e comportamento esperado por fase.
- `docs/ai-skills` para especializações operacionais reutilizáveis.
- `IMPLEMENTATION_PLAN.md` para fase atual, próximas fatias e ordem de implementação.
- `DECISIONS.md` para decisões fechadas, rationale e trade-offs aceitos.
- `CHANGELOG_AI.md` para histórico do que mudou, por que mudou e qual foi a próxima etapa.
- `TODO_AI.md` para pendências operacionais e ações imediatas.

Esses arquivos funcionam como memória persistente do time IA-First. A IA não deve reconstruir esse contexto a cada turno quando ele já existe de forma versionada.

## Quando usar Context

Use Context sempre que a tarefa depender de decisões já consolidadas, como produto, arquitetura, segurança, envs, deploy, tenancy, auth, billing e rollout.

Context serve para:

- preservar decisões;
- evitar respostas genéricas;
- manter continuidade entre sessões;
- permitir recuperação após perda de contexto;
- reduzir divergência entre Copilot, GPTs, Claude Code e outros agentes.

Context não é um arquivo de ideias soltas. Ele é a base operacional do projeto.

## Quando usar Specs

Specs descrevem contratos, boundaries, comportamento esperado e regras de evolução.

Use Specs quando a tarefa exigir definição ou revisão de:

- auth e ownership;
- billing e trial;
- deploy e rollback;
- integrações externas;
- permissões;
- rollout incremental;
- arquitetura de domínio.

Specs existem para tornar explícito o que o código precisa respeitar antes da implementação. Elas reduzem ambiguidade e ajudam a revisar mudanças sem inferir intenção do zero.

## Quando usar Skills

Skills são blocos de conhecimento especializado e reutilizável. Elas servem para orientar execução em áreas técnicas recorrentes sem reexplicar o básico a cada tarefa.

Exemplos de uso:

- `deploy` e `Docker` para operação e empacotamento;
- `Swarm` para orquestração simples e baixo custo;
- `database` para contratos, migrations e validações;
- `auth` para boundaries, sessão e segurança;
- `observability` para logs, healthchecks e diagnóstico;
- `testing` para validação e regressão.

Skills devem ser pequenas, revisáveis e específicas. Se uma skill tentar virar uma arquitetura paralela, ela perdeu o propósito.

Toda skill deve:

- apontar para os specs oficiais e para o operating model;
- respeitar boundaries de auth, ownership, deploy e permissões;
- especializar, operacionalizar e orquestrar, nunca redefinir arquitetura.

## Quando usar Agents

Agents são para orquestração multi-etapas, investigação e raciocínio que atravessa mais de um artefato ou mais de uma decisão.

Use Agents para:

- troubleshooting com contexto amplo;
- diagnóstico de deploy;
- análise de arquitetura;
- segurança e boundaries;
- revisão de rollout;
- tarefas que exigem sequência de leitura, comparação e decisão.

O agente de infraestrutura existe porque infraestrutura é contexto persistente. Operação, deploy e topologia não são detalhes locais de um único prompt; eles precisam de continuidade e memória.

Isto também explica por que a DataVisio não deve criar dezenas de agents superficiais. O objetivo é poucos agents com responsabilidade clara, não uma coleção de avatares com sobreposição de função.

Agents devem seguir o mesmo modelo de governanca:

- usar docs/ai-context e docs/specs como base;
- registrar checkpoints quando houver mudança relevante;
- manter rollout incremental e rollback-safe;
- parar quando a tarefa exigir decisão arquitetural fora do escopo do prompt.

## Quando usar Prompts

Prompts são a camada temporária de execução. Eles servem para tarefas pontuais, locais e incrementais.

Use Prompts para:

- implementar uma fatia pequena;
- refatorar um trecho isolado;
- gerar documentação incremental;
- ajustar testes;
- investigar uma falha específica;
- executar automações curtas e controladas.

Prompts não substituem Context, Specs ou Agents. Eles apenas executam uma intenção bem definida com escopo limitado.

## Pipeline operacional obrigatório

O fluxo padrão da DataVisio deve seguir esta ordem:

Context
↓
Spec
↓
Agent
↓
Skill
↓
Prompt
↓
Human Review
↓
Validation
↓
Commit
↓
Documentation Update

Leitura prática do pipeline:

- Context define o que já é verdade.
- Spec define o que deve acontecer.
- Agent coordena quando a tarefa é complexa.
- Skill fornece expertise localizada.
- Prompt executa o passo atual.
- Human Review bloqueia excesso de confiança.
- Validation confirma que a mudança é real.
- Commit registra o resultado.
- Documentation Update preserva memória.

## Modelo de sincronização

Quando `docs/ai-context` ou `docs/specs` mudarem, a camada operacional deve ser revisada na mesma direção:

- atualizar `docs/ai-skills` se a especialização exposta ao operador depender do novo contrato;
- alinhar `.claude/skills` quando houver heurística local refletindo a mesma regra;
- alinhar `.github/agents` quando o fluxo multi-etapas depender do novo boundary;
- registrar divergências, descontinuidade ou substituição em `CHANGELOG_AI.md` e `DAILY_CHECKPOINT.md`.

Como detectar drift:

- skill ou agent que repete arquitetura já decidida em specs;
- regra operacional divergente do boundary oficial;
- instrução antiga que contradiz o estado atual do runtime;
- duplicação de responsabilidade entre docs, skills e agents.

Quando houver drift, a ordem é: documentar a incompatibilidade, escolher a fonte oficial e sincronizar a camada operacional mais próxima do uso real.

## Compatibilidade e sincronização incremental

O modelo de versionamento não usa semver pesado nem compatibilidade automática. Ele depende de leitura, registro e atualização incremental.

Regra prática:

- se a baseline oficial mudar, a compatibilidade declarada nas skills e agents deve ser revisada na mesma entrega;
- se apenas a implementação mudar sem alterar contrato, o versionamento permanece;
- se o contrato mudar, a versão precisa ser registrada e o histórico deve apontar o motivo.

## Infraestrutura e decisão IA

A infraestrutura real do VisioMilhas influencia diretamente o modelo IA.

Implicações práticas:

- VPS enxuta em Hostinger KVM 2 significa evitar automações pesadas e stacks inchadas.
- Swarm single manager significa evitar abstrações enterprise e orquestração desnecessária.
- Deploy manual com confirmação textual significa evitar agentes autônomos destrutivos.
- Monolito modular significa evitar agentes fragmentados por microserviço inexistente.
- Baixo custo operacional significa priorizar simplicidade, previsibilidade e poucas peças móveis.
- Crescimento incremental significa rollout incremental também para IA e automação.

Infraestrutura não é só ambiente de execução. Ela é limite de projeto.

## Quando não usar IA

A IA não deve tomar as seguintes ações sozinha:

- deploy destrutivo automático;
- migrations perigosas;
- alteração de secrets;
- modificação de GitHub Secrets;
- execução de deploy sem confirmação humana;
- mudanças em produção sem revisão;
- geração de workflows perigosos;
- espalhar middleware agressivo ou abstrações enterprise;
- commitar `.env`;
- expor tokens, chaves ou dados sensíveis.

Se a tarefa pode causar indisponibilidade, vazamento ou custo operacional desnecessário, a IA deve parar na recomendação e aguardar humano.

## Segurança operacional IA

Regras mínimas:

- nunca imprimir secrets ou tokens;
- nunca versionar arquivos de ambiente sensíveis;
- nunca alterar produção de forma autônoma;
- nunca publicar workflow perigoso sem revisão;
- nunca tratar billing crítico sem checagem humana;
- nunca ampliar o sistema com camadas desnecessárias só porque a IA consegue gerar.

## Uso em futuros SaaS DataVisio

Este modelo deve ser reutilizado por futuros SaaS da DataVisio com a mesma ordem de prioridade:

1. recuperar Context antes de pensar em solução;
2. registrar Specs antes de grandes mudanças;
3. usar Agents apenas quando houver raciocínio multi-etapas;
4. usar Skills como suporte especializado;
5. usar Prompts para execução local e incremental;
6. validar com humano e documentação atualizada.

Reutilizar o modelo não significa copiar tudo sem adaptação. Significa preservar a espinha: memória persistente, boundaries explícitas, automação limitada e revisão humana para decisões críticas.

## Resultado esperado

Quando esse modelo é seguido, a DataVisio ganha:

- menos improviso;
- menos fragmentação documental;
- menos excesso de agents;
- menos risco operacional;
- mais previsibilidade;
- mais reaproveitamento entre projetos;
- uma fundação AI-native que continua simples o bastante para ser mantida.
