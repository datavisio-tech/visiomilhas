# Legacy Deployment Audit

[AGENT]
Nome do agente: Legacy Deployment Audit Agent
Status: LEGACY_DEPLOY_AUDITED

## Objetivo

Auditar o workflow legado `.github/workflows/production-deploy-manual.yml` e decidir se ele deve ser mantido, arquivado ou removido.

## Veredito

**Recomendação: ARCHIVE**

O workflow ainda é válido como referência histórica e como fallback documental do antigo fluxo Swarm, mas **não é necessário para o caminho operacional atual**. O fluxo ativo de produção passou a ser `deploy-prod.yml`, que usa o deploy standalone e a arquitetura atual.

## Respostas diretas

### 1. Ele ainda é necessário?

**Não** para o caminho ativo atual.

Ele só seria necessário se a equipe ainda quisesse manter formalmente um caminho de deploy baseado em Swarm e stack deploy.

### 2. Qual funcionalidade ele possui que não existe em `deploy-prod.yml`?

O workflow legado contém o conjunto de operações do antigo ambiente Swarm:

- carregamento de `config/production-public.env`
- validação de deploy manual via `workflow_dispatch`
- criação/garantia da rede `traefik_public` em modo overlay
- deploy do Traefik via `docker stack deploy -c stack.traefik.yml traefik`
- deploy da aplicação via `docker stack deploy -c stack.visiomilhas.yml visiomilhas`
- inspeção explícita do estado do Traefik Swarm
- validação via `docker service ps` e logs do serviço

Essas capacidades não existem no `deploy-prod.yml`, porque o workflow novo usa:

- deploy standalone
- `docker compose`
- validação de HTML/DOCTYPE e OAuth bootstrap no fluxo atual

### 3. Pode ser removido?

**Sim, tecnicamente pode.**

Mas a remoção deveria acontecer somente se a organização aceitar perder o histórico operacional do fluxo Swarm.

### 4. Pode ser arquivado?

**Sim, e esta é a recomendação.**

Arquivar é o melhor equilíbrio entre:

- não manter o workflow como rota ativa
- preservar a memória operacional do deploy antigo
- evitar que o arquivo continue competindo com o fluxo oficial

### 5. Existe risco operacional em mantê-lo?

**Sim.**

Principais riscos:

- confusão entre o deploy oficial e o deploy legado
- drift operacional entre dois caminhos de release
- manutenção duplicada
- aumento de superfície de erro
- uso acidental de um fluxo já superado pela arquitetura atual

### 6. Existe risco operacional em removê-lo?

**Sim, mas é moderado e controlável.**

Principais riscos:

- perda do histórico exato do fluxo Swarm
- perda de referência para rollback operacional antigo
- perda de documentação executável para um cenário legado

Como o fluxo atual já está em `deploy-prod.yml`, o risco de remoção é menor do que o risco de manter o arquivo como caminho paralelo ativo.

## Evidência concreta no repositório

### Arquivo auditado

- `.github/workflows/production-deploy-manual.yml`

### Comparado com o workflow ativo

- `.github/workflows/deploy-prod.yml`

### Evidências que comprovam unicidade do legado

O workflow legado possui operações que não existem no workflow atual:

- `docker stack deploy -c stack.traefik.yml traefik`
- `docker stack deploy -c stack.visiomilhas.yml '${STACK_NAME}'`
- `docker network create --driver overlay --attachable traefik_public`
- validação de serviço via `docker service ps`

O workflow atual usa:

- `docker compose -f docker-compose.visiomilhas.standalone.yml up -d`
- smoke tests HTTP com `<!DOCTYPE html>`
- validação de bootstrap OAuth
- healthcheck por `docker exec ... node scripts/healthcheck.js`

## Sintaxe e integridade

- Sintaxe YAML: **válida**
- Workflow executável: **sim**
- Referências diretas no repositório: **sim**

## Risco de manter

| Risco | Nível | Observação |
|---|---:|---|
| Drift entre caminhos de deploy | Alto | Dois deploys ativos geram divergência futura. |
| Confusão operacional | Alto | Operadores podem usar o caminho errado. |
| Manutenção duplicada | Médio | Correções teriam de ser replicadas ou racionalizadas. |
| Legado de Swarm vivo | Médio | Mantém uma rota antiga que não é mais a principal. |

## Risco de remover

| Risco | Nível | Observação |
|---|---:|---|
| Perda de referência histórica | Médio | O workflow é uma boa documentação executável do fluxo antigo. |
| Perda de fallback Swarm | Baixo/Médio | Relevante apenas se a equipe ainda precisar operar Swarm. |

## Conclusão operacional

O workflow legado **não deve permanecer como caminho ativo**.

Ele deve ser:

1. **arquivado** como referência histórica,
2. removido do caminho principal de manutenção,
3. mantido apenas se houver uma necessidade explícita de suporte ao fluxo Swarm.

## Recomendação final

**ARCHIVE**

