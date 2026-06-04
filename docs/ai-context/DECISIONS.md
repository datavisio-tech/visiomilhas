## 2026-06-03 â€” Pipeline Hardening for Environment Segregation

- DecisÃ£o: `npm run typecheck` deve rodar em checkout limpo usando `tsconfig.typecheck.json` source-only, sem depender de `.next/types/**/*.ts`.
- DecisÃ£o: os workflows HM e PROD passam a validar explicitamente `<!DOCTYPE html>` nas rotas pÃºblicas e redirecionadas.
- DecisÃ£o: os workflows HM e PROD passam a validar bootstrap OAuth Google por resposta nÃ£o-503, sem `AUTH_BOOTSTRAP_FAILED` e com redirect para `accounts.google.com`.
- DecisÃ£o: os gates permanecem em ordem `lint -> typecheck -> build`, mas o `typecheck` agora Ã© independente do artefato gerado pelo build.

## 2026-06-03 - OAuth matrix correction

- Decisao: DEV uses a local-only Google OAuth client in `.env.local`.
- Decisao: HM and PROD share the same Google OAuth client.
- Decisao: `BETTER_AUTH_SECRET` is shared across DEV, HM and PROD; `AUTH_SECRET` stays only as a legacy fallback for compatibility.

# DECISIONS - VisioMilhas

## 2026-06-03 — Environment Segregation Implementation

- Decisão: HM e PROD devem ter workflows próprios e progressão por branch (`develop` e `main`).
- Decisão: o workflow de produção passa a ser explicitado em `deploy-prod.yml`.
- Decisão: a preparação do Production V2 exige migration explícita para Better Auth antes do primeiro bootstrap vazio.
- Decisão: a fase atual não executa deploy, migrations nem seeds; apenas prepara o caminho de implementação.

# 2026-06-03 — Environment Segregation Architecture v1

- Decisão: DEV e HM compartilham `postgres_db` e `mongodb` neste momento para reduzir custo operacional e acelerar validação.
- Decisão: HM passa a ser o ambiente de validação funcional e pre-produção em `hm.visiomilhas.visiochat.cloud`.
- Decisão: PROD deve entrar com bootstrap limpo, sem herdar dados de DEV/HM e sem migração de dados.
- Decisão: o contrato de produção permanece com os bancos lógicos `controle_adm_saas_datavisio` e `visiomilhas_app`, agora apontando para a nova infraestrutura PostgreSQL de produção.
- Decisão: `mongodb_prod_v2` fica como futuro e nao bloqueia o primeiro cutover se não houver dependência runtime comprovada.
- Decisão: Google OAuth deve ser compartilhado entre HM e PROD, com redirecionamentos autorizados para ambos os domínios.
- Decisão: os workflows de deploy devem ser separados em `deploy-hm.yml` e `deploy-prod.yml`, ambos com gates obrigatórios de lint, typecheck, build e healthcheck.
- Decisão: o branch `develop` alimenta HM e o branch `main` alimenta PROD.
- Decisão: qualquer deploy deve falhar se lint, typecheck, build ou healthcheck falharem.

# 2026-06-01 — Subscription UX Refinement

- Decisão: a experiência `/subscribe` deve tratar o VisioMilhas como ERP operacional financeiro para milhas, não apenas como gerenciador de milhas.
- Decisão: a página pode exibir valores comerciais apenas via variáveis de ambiente `PLANO` e `PLANO_ANUAL`, mantendo a migração futura para `controle_adm_saas_datavisio` aberta.
- Decisão: o refinamento é estritamente de UX/copy; não altera Better Auth, guards de assinatura, multi-tenancy, Stripe, checkout, billing real ou persistência de planos.
- Decisão: `NO_SUB` deve ser explicado ao usuário como modo somente leitura, preservando dados e removendo apenas permissões de alteração.

# 2026-05-31 — purchases-analytics-stabilization

- Decisão: o KPI de Purchases deve continuar agregado por `status` e filtrado por `organizationId` no server render.
- Decisão: a correção do `42803` deve permanecer mínima e localizada na query, sem criar novos fluxos de negócio.
- Decisão: `accountId` pode existir como filtro opcional no KPI, mas a página atual segue operando no escopo por organização até haver UX explícita para seleção de conta.

# 2026-05-31 — purchases-journey-stabilization

- Decisão: a jornada de Purchases deve resolver a conta operacional real pelo runtime e nunca usar `accountId`/`programId` fixos na fixture.
- Decisão: o `programId` enviado para criação de compra deve ser derivado da própria conta operacional selecionada, e o backend continua sendo a fonte de verdade final.
- Decisão: se o seletor estiver vazio, a fixture pode preparar uma conta operacional de teste, mas sempre com o mesmo tenant e com dados consistentes entre conta e programa.

# 2026-05-31 — subscription-access-stabilization

- Decisão: o estado `NO_SUB` precisa ser auditado com um usuário fresco, sem ativar trial no mesmo fluxo de validação.
- Decisão: o runner de auditoria pode preparar dados de teste, mas não deve promover o caso `NO_SUB` antes da coleta de evidências read-only.
- Decisão: `NO_SUB` é um estado real do domínio e deve permanecer observável como `NO_SUBSCRIPTION` com escrita bloqueada.
- Decisão: `TRIAL` e `ACTIVE` continuam sendo os únicos estados com escrita liberada nas rotas de Purchases.

# 2026-05-31 — alinhamento de origem do runtime MCP

- Decisão: a origem do runtime local precisa ser derivada do `PORT` em desenvolvimento para evitar `INVALID_ORIGIN` no Better Auth.
- Decisão: `BETTER_AUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL` e `trustedOrigins` devem permanecer coerentes com o servidor Next ativo.
- Decisão: o runtime MCP deve continuar usando o comportamento real do produto, sem bypass, fake auth ou `allowFallback` como solução definitiva.
- Decisão: o cenário `NO_SUB` continua sendo um gap de produto/runtime enquanto o primeiro acesso de subscription promove o usuário para `TRIAL`.

# 2026-05-30 — Campaign Catalog Engine 4.3-C

- Decisão: o catálogo de campanhas parceiras deve viver em `src/modules/campaigns`, separado dos módulos operacionais de Purchases e Programs.
- Decisão: a primeira versão do motor será dirigida por seed JSON e providers vazios, sem scraping automático nesta release.
- Decisão: `partner_campaigns` deve guardar metadados de parceiro, programa, tipo, status e origem para servir de base ao autofill futuro da compra bonificada.
- Decisão: `campaign_snapshots` é a tabela oficial para preservar histórico de observações do catálogo sem misturar esse dado com o registro principal.

# 2026-05-30 — Purchases como cockpit operacional 4.3-B.2.A

- Decisão: Purchases passa a ser tratado como cockpit operacional baseado em Kanban, não como tabela primária.
- Decisão: o fluxo de status oficial é `REGISTERED -> TRACKED -> PENDING_CREDIT -> RECEIVED` e qualquer etapa pode ir para `PROBLEM`.
- Decisão: `RECEIVED` deve criar `PURCHASE_BONUS` de maneira idempotente e refletir atualização contábil no programa e na conta destino.
- Decisão: o `organizationId` do cockpit deve vir do servidor e ser repassado ao cliente para manter a UI e as mutações no tenant correto.
- Decisão: o runtime MCP deve validar o fluxo completo no ambiente real, sem mocks, usando Chrome DevTools MCP.

# 2026-05-29 — Programs como cockpit operacional 4.2-B

- Decisão: `Programs` deixa de ser apenas uma visão contextual e passa a ser o cockpit operacional da conta.
- Decisão: `accountId`, `tab` e `period` devem ser persistidos na URL para permitir refresh e troca de conta sem perda de contexto.
- Decisão: a camada de Programs deve viver em `src/modules/programs`, separando domínio, aplicação, infraestrutura e apresentação.
- Decisão: quick actions devem reutilizar os formulários existentes de compra, venda e transferência, sem criar um segundo motor de mutações.
- Decisão: o extrato operacional deve ser um contrato estruturado com saldo pós-movimento, CPM e valor financeiro por linha.

### 2026-05-29 — 4.2-B.1 Decisions (Programs UX Refinement)

- Decisão: reduzir a altura do header (~40%) para priorizar o conteúdo operacional sem perder a presença de marca.
- Decisão: mover o seletor de conta para dentro do header e oferecer a ação explícita `Trocar conta` apontando para `/app/accounts`.
- Decisão: evitar duplicação de KPIs — header contém visão executiva condensada; cards permanecem para indicadores operacionais detalhados.
- Decisão: o `Resumo` passa a priorizar `KPIs` → `Extrato operacional resumido` → `Gráficos`; os gráficos são complementares.
- Decisão: substituir a `Timeline` por uma `TransactionTable` com colunas operacionais padronizadas (`Data`, `Operação`, `Tipo`, `Pontos`, `Valor`, `CPM`, `Status`).
- Decisão: sidebar contextual fixa à direita (sticky) com cards compactos para `Conta`, `Pendências` e `Assinaturas`.
- Decisão: breadcrumb e controle de troca de conta devem existir no header para otimizar navegação e reduzir camadas.
- Decisão: os cards operacionais do corpo devem priorizar resultado, pendências, compras do período, vendas do período e transferências abertas, deixando gráficos como suporte visual.

# DECISIONS - VisioMilhas

# 2026-05-29 — separação rígida de `/sign-in` 3.7-E

- Decisão: a coluna esquerda passa a ser exclusivamente de marketing/conversão, concentrando headline, preview e storytelling do produto.
- Decisão: a coluna direita passa a ser exclusivamente de autenticação, sem qualquer conteúdo de produto ou prova social operacional.
- Decisão: o logo VisioMilhas, o título, os botões de login e os links de criação/recuperação devem permanecer na direita como os únicos elementos de interface do acesso.
- Decisão: a aparência da área direita deve permanecer clara, minimalista e neutra, reforçando confiança sem competir com a coluna de marketing.

# 2026-05-29 — refinamento premium de `/sign-in` 3.7-D

- Decisão: a headline `Controle suas milhas como um operador profissional.` é a melhor escolha para o posicionamento premium atual, por comunicar domínio operacional sem soar genérica ou agressiva demais.
- Decisão: a separação marketing/operação deve ser suavizada com gradiente e glow central para evitar a sensação de layout colado.
- Decisão: o preview de marketing pode usar KPIs e movimentações fictícias como prova visual, desde que isso fique claramente sem dependência de backend.
- Decisão: o card operacional deve ganhar microcopy de confiança e hover sutil, mantendo o foco em autenticação.

# 2026-05-29 — separação visual de `/sign-in` 3.7-C

- Decisão: manter o comportamento atual de auth intacto e alterar apenas a composição visual da tela `/sign-in`.
- Decisão: o desktop deve comunicar dois contextos distintos, com marketing escuro à esquerda e operação clara à direita.
- Decisão: o lado operacional deve usar leitura mais leve, card branco e preview mockado para reforçar o contexto de acesso ao produto.
- Decisão: tablet e mobile devem empilhar com a autenticação antes do conteúdo de marketing.

# 2026-05-28 — Hub de autenticação unificado 3.7-B

- Decisão: manter Google OAuth como caminho principal em `/sign-in` e adicionar fallback por e-mail/senha via modais, sem criar páginas públicas extras.
- Decisão: login, cadastro e recuperação de senha compartilham a mesma identidade visual premium e permanecem na mesma superfície.
- Decisão: reset de senha ocorre em `/reset-password` com token temporário e expiração controlada pelo Better Auth.
- Decisão: mensagem de recuperação é não-disclosive (não confirma existência de e-mail na base).
- Decisão: fallback por credenciais deve preservar compatibilidade com onboarding/ownership existentes.

# 2026-05-27 — Central operacional de contas 3.6-A

- Decisão: a tela `/app/accounts` deve ser tratada como central operacional de contas de milhas, não como tabela administrativa genérica.
- Decisão: o mesmo programa pode ter múltiplas contas e isso deve ser visível na lista sem agrupar ou esconder registros.
- Decisão: `display_name` visual é derivado do programa + apelido, mantendo a leitura imediata sem exigir preenchimento manual extra.
- Decisão: saldo inicial e CPM inicial são opcionais no cadastro; quando o saldo inicial existir, a conta deve ganhar uma operação seed `INITIAL_BALANCE`.
- Decisão: exclusão inicial é soft delete/inactive, sem remoção física da linha.
- Decisão: a UI deve seguir linhas premium e limpas, com branding de programa simples e sem excesso de métricas ou aparência enterprise pesada.

## 2026-05-22 — reindex do workflow manual de produção

- Decisão: renomear o workflow de produção para `production-deploy-manual.yml` com nome amigável `Production Deploy Manual - VisioMilhas`.
- Motivo: o GitHub Actions continuou retornando `HTTP 422: Workflow does not have 'workflow_dispatch' trigger` para o filename anterior, apesar do YAML local e do `gh workflow view` mostrarem `workflow_dispatch`.
- Efeito esperado: forçar nova indexação do workflow manual sem introduzir gatilhos automáticos.
- Regras preservadas: `workflow_dispatch` manual, `environment: production`, confirmação textual `DEPLOY`, `USE_FIFO_MOVEMENTS_ENGINE=0`, sem migrations e sem seeds.

Principais decisões técnicas para o MVP1:

- Framework: Next.js (App Router) — por integração com Server Components e rotas modernas.
- Linguagem: TypeScript com `strict` ativado — segurança de tipos e maior robustez.
- UI: Tailwind CSS + shadcn/ui — produtividade e componentes acessíveis.
- ORM: Drizzle ORM + drizzle-kit — tipagem forte para queries e compatibilidade com PostgreSQL.
- Banco: PostgreSQL para dados relacionais do MVP1.

Autenticação (escolha e justificativa):

- Escolha: Auth.js (antigo NextAuth) / Auth.js — justificativa:
  - Madura e amplamente adotada em projetos Next.js;
  - Suporta providers (Google OAuth) e email/senha via adaptadores;
  - Fácil integração com callbacks para criar organização, memberships e subscriptions no onboarding;
  - Comunidade e exemplos para integração com Stripe e adaptadores de banco.

Billing:

- Stripe como provedor de billing. Implementar estrutura inicial (customers, subscriptions, webhooks).

Multi-tenant:

- Tenant por organização. `organizationId` presente em todas as tabelas de negócio.
- Dados administrativos globais separados em `control_adm_saas_datavisio`.

Outras decisões:

- Tratar dinheiro em centavos (integers) em todas as tabelas/entradas.
- Tratar pontos como inteiros; evitar floats para cálculos monetários.
- Centralizar validações em `lib/validations` (Zod) e cálculos em `lib/calculations`.

- Decisão adicional: usar `lib/domain` para funções puras de cálculo relacionadas a milhas (CPM, impactos de compra/venda/transferência) e `lib/validations` (Zod) para validar entradas antes de chegar à camada de domínio. Essa separação facilita testes unitários e portabilidade.
  \
  Decisão adicional sobre testes:

- Adotar `Vitest` como framework de testes unitários para funções puras do domínio (rápido e integrado com Vite/esbuild).
- Manter testes de domínio separados dos testes de UI e integrações; usar `tests/domain` como localização preferida.

Decisão sobre runtime:

- Padronizar runtime em Node 24 LTS para o projeto, garantindo compatibilidade com ferramentas modernas e reduzindo dívida técnica.
- Evitar suporte a Node 21 (EOL) — forçar ambientes locais e CI para Node >=24.

Database migration & seeds decisions:

- Usar duas configurações separadas do Drizzle: `drizzle.adm.config.ts` e `drizzle.app.config.ts` para separar a base administrativa (ADM) da base da aplicação (APP).
- Fluxo principal de migrações: `generate` -> `migrate` (não usar `push` como padrão). Gerar migrações para cada DB separadamente e aplicar com `drizzle-kit migrate`.
- Seeds idempotentes em `db/seed/` e execução controlada via `npm run db:seed` (scripts usam `tsx` para rodar TypeScript diretamente).
- Introduzida variável `POSTGRES_ADMIN_DATABASE_URL` e script seguro `db:create-databases` para criar as bases necessárias (`controle_adm_saas_datavisio`, `visiomilhas_app`) antes de aplicar migrations. O admin URL deve apontar para uma base existente (eg. `postgres`) e o usuário deve ter permissão `CREATE DATABASE`.

Decisão sobre extrato (entries):

- Usar `mile_entries` como fonte inicial do extrato consolidado. Compras/vendas/transferências permanecem em suas tabelas e serão integradas ao extrato em etapas futuras; não será feita união complexa nesta fase.

Versionamento operacional:

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`)
- MVP atual: `1` (MVP1)
- Etapa/Funcionalidade atual: `1.1` — Fundação técnica, banco, migrations e seed inicial
- Versão operacional atual registrada: `1.1.6` — próxima incremental: `1.1.7`
- Versão operacional atual registrada: `1.2.1` — próxima incremental: `1.2.2`

## 2026-05-23 — direcao de produto e stack IA-First

- Decisão: VisioMilhas seguirá como SaaS B2C de assinatura individual mensal recorrente, com foco em usuarios finais, milheiros e viajantes.
- Decisão: o produto nao sera white-label.
- Decisão: a experiencia principal sera de uma conta/pessoa, mantendo organization_id por compatibilidade tecnica e evolucao futura, sem multi-organizacao enterprise como prioridade.
- Decisão: permissões simplificadas nesta fase, com usuario comum e admin interno.
- Decisão: a aplicacao administrativa global da DataVisio sera uma aplicacao separada, responsavel por billing consolidado, contratos, licencas e metricas do ecossistema.
- Decisão: observabilidade inicial sera minima, com logs basicos, healthcheck e diagnostico de erros criticos.
- Decisão: a IA dentro do produto nao e prioridade inicial; a stack IA-First e operacional/de desenvolvimento, focada em memoria persistente, specs, prompts, skills e agentes controlados.
- Decisão: a arquitetura inicial continua monolito modular, sem microservicos como meta de curto prazo.
- Decisão: o operating model oficial passa a ser `AI_OPERATING_MODEL.md`, que define quando usar Context, Specs, Skills, Agents e Prompts.
- Decisão: os fluxos de escrita nao devem aceitar `orgSlug` como boundary; `organizationId` deve ser derivado no servidor.
- Decisão: transferencias devem validar origem e destino sob a mesma ownership antes de atualizar saldos.

### 2026-05-24 — 2.2-D Better Auth Operational Consolidation

- Decisão: Better Auth é o caminho operacional primário para os fluxos já migrados.
- Decisão: o fake auth adapter permanece transitional para desenvolvimento local, testes e recovery controlado.
- Decisão: fallback precisa ser observável com source, reason e timestamp para permitir redução gradual segura.
- Decisão: não introduzir middleware global nem RBAC novo nesta fase.

Decisão operacional recente (1.2.8):

- Reforçar separação ADM/APP: resolver `organizations` apenas no ADM e ler dados do produto no APP.
- Erro `42P01` (relation does not exist) deve ser tratado explicitamente com `isMissingRelationError` e usado somente como fallback de desenvolvimento.

Mudanças de lint:

- Remover export default anônimo em helpers (ex.: `lib/data/db-errors.ts`) para evitar warnings `import/no-anonymous-default-export`.

Decisão adicional (2026-05-18):

- Não importar Server Actions diretamente em API Routes. Em vez disso, extrair a lógica transacional e de domínio para um service compartilhado (`lib/services/movements.ts`) que possa ser chamado tanto por Server Actions quanto por handlers de rotas API. Essa separação evita proxies/runtime issues (ex.: `TypeError: Cannot redefine property: $$id`) e mantém uma única fonte de verdade para regras de negócio.

- A estratégia de migração para essa decisão:
  1. Criar `lib/services/movements.ts` com contratos e implementações transacionais.
  2. Atualizar Server Actions para delegarem ao service (sem alterar a assinatura pública das actions).
  3. Atualizar `app/api/*/route.ts` para usar o mesmo service e remover import estático de actions.
  4. Validar via testes unitários e manuais.

- 2026-05-18: Preparação do schema 1.3.12 — `mile_point_lots` adicionada ao schema Drizzle e migration proposta criada (`db/app/migrations/0001_add_mile_point_lots.sql`). Migration não foi aplicada; objetivo é revisar e validar antes de aplicar em ambientes controlados.
- 2026-05-18: Refinamento da migration (1.3.13) — a migration proposta foi atualizada com FKs, índices e checks propostos em `db/app/migrations/0001_add_mile_point_lots.sql`. A decisão foi incluir constraints que reforcem integridade, mantendo `ON DELETE RESTRICT` em relações financeiras e `ON DELETE SET NULL` quando apropriado para origem de lotes. Migration está proposta para revisão e NÃO APLICADA.

- 2026-05-18: Consolidação do motor FIFO puro (1.3.14) — o motor de movimentações (`lib/services/movements.ts`) foi consolidado como um service desacoplado da persistência, validado por testes unitários in-memory. A implementação concreta do `MovementsRepo` com Drizzle e transações fica para 1.3.15.
- 2026-05-18: Consolidação do motor FIFO puro (1.3.14) — o motor de movimentações (`lib/services/movements.ts`) foi consolidado como um service desacoplado da persistência, validado por testes unitários in-memory. A implementação concreta do `MovementsRepo` com Drizzle e transações fica para 1.3.15.

- 2026-05-18: Integração atômica da compra ao motor FIFO (1.3.20)

- Decisão: integrar o fluxo de compra/aquisição ao motor FIFO como primeiro caso de uso atômico.
- Motivo: compra cria entry + lot de forma determinística, é o fluxo mais simples para validar transação end-to-end.
- Implementação: `createPurchaseAction` delega ao `acquireMilesUseCase(..., txRepo)` quando `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa; o `txRepo` é criado por `createDrizzleMovementsRepoFromClient(client)` que usa o `pg` client corrente, evitando abertura de nova conexão/transaction.
- Segurança: a feature flag permanece desligada por padrão; a integração só roda quando explicitamente ativada em staging após validação da migration.
- Garantia transacional: `acquireMilesUseCase` é executado dentro da mesma transação do `createPurchaseAction` (rollback único em caso de falha).
- Próximo: validar em staging com a migration `db/app/migrations/0001_add_mile_point_lots.sql` aplicada e testar rollback/rollback scenarios.
- Planejamento 1.3.15: implementar `MovementsRepo` usando Drizzle, garantir operações transacionais (atomicidade/rollback) e alinhar migrations/constraints. Esta etapa requer validação em DB de desenvolvimento isolado e backup antes de aplicar migrations em produção.
- 1.3.16: Implementação concreta do `MovementsRepo` com Drizzle realizada em `lib/repositories/movements.drizzle-repo.ts`. Mantém-se a prática de aplicar constraints/índices via migrations SQL; migratons não foram aplicadas automaticamente nesta etapa.

Nota operacional (2026-05-20):

- As bases `DATABASE_STAGING` e `DATABASE_TEST` foram criadas pelo usuário e devem ser acessadas exclusivamente por `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` (armazenadas em secrets/`.env.local` ou no cofre do CI). Nunca apontar `STAGING_DATABASE_URL`/`TEST_DATABASE_URL` para produção.

Decisões recentes (1.3.21):

- A compra/aquisição foi o primeiro fluxo real integrado ao motor FIFO e protegido por testes unitários.
- A feature flag `USE_FIFO_MOVEMENTS_ENGINE` permanece OFF por padrão; ativação requer validação em staging e decisão explícita.
- O rollback foi coberto por testes unitários com mocks (simulação) — o rollback em produção precisa ser validado em DB isolado com a migration aplicada.
- As integrações de venda/consumo/transferência devem aguardar validação bem-sucedida em staging (aplicação da migration, testes de integração e QA) antes de serem integradas ao motor FIFO.

### 2026-05-20 — decisão complementar 1.3.25.1

- Confirmar testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL` (rollback, FIFO, transfer) antes de qualquer ativação de flag em ambientes compartilhados. Testes foram executados e validados localmente.
- Permanecer com `USE_FIFO_MOVEMENTS_ENGINE` OFF até validação em staging/CI com evidências sanitizadas.

### 2026-05-20 — decisão operacional CI (1.3.25.2)

- Criar workflow manual (`workflow_dispatch`) para executar testes de integração contra `TEST_DATABASE_URL` no GitHub Actions; o job valida a presença do secret `TEST_DATABASE_URL`, aplica/valida migrations de teste e roda `npm run test:integration`.
- O workflow não deve expor secrets, não executa seeds e mantém `USE_FIFO_MOVEMENTS_ENGINE=0` durante a execução.

### 2026-05-20 — decisão operacional 1.3.26.1

- A preparação do QA manual da compra FIFO deve ser documentada primeiro e executada com ativação explícita da flag apenas em staging.
- O validador read-only deve aceitar parâmetros seguros para localizar a compra e a conta, sem fazer writes.
- Em caso de falha no QA, o rollback operacional é desligar `USE_FIFO_MOVEMENTS_ENGINE` em staging e recarregar a aplicação, sem tocar em produção.

### 2026-05-21 — diagnóstico de runtime da compra FIFO

- O runtime local da compra usa `APP_DATABASE_URL` e, nesta máquina, aponta para `visiomilhas_app`.
- Se `mile_point_lots` estiver ausente no runtime local, a falha deve ser tratada como desalinhamento de ambiente/schema, não como correção funcional de compra.
- Para concluir QA staging, preferir o app staging real já validado, em vez de localhost.

### 2026-05-20 — Uso controlado de skills locais

- Skills locais em `.claude/skills` são consideradas ferramentas de apoio; o agente residente é a autoridade final para decisões operacionais.
- Skills podem ser consultadas para recomendações, auditorias de código e sugestões, mas NÃO podem autorizar ações operacionais (push, PR, merge, deploy, seed, migration) sem aprovação humana explícita.
- Em caso de conflito entre a recomendação de uma skill e a documentação/decisões do projeto, o agente deve registrar o conflito, documentar o risco e solicitar confirmação do operador.

### 2026-05-21 — produção e deploy remoto

- GitHub Actions gera `.env.production` no servidor a partir das Environment Secrets de `production`.
- O GitHub Environment `production` e suas secrets já foram cadastrados manualmente pelo operador.
- O deploy final depende de auditoria prévia do Docker, do modo Compose/Swarm, do Portainer e do Traefik existente.
- O deploy remoto usa o usuário SSH `gitdatavisiodeploy`, o diretório `/opt/datavisio/visiomilhas` e não utiliza root.
- A produção inicial mantém `USE_FIFO_MOVEMENTS_ENGINE=0`.

### 2026-05-21 — auditoria 1.3.30 e estratégia Swarm

- A auditoria read-only confirmou Docker Swarm ativo no host de produção.
- O Traefik já existe como serviço do stack `traefik`, com rede overlay `traefik_public`.
- Estratégia recomendada para o VisioMilhas: `docker stack deploy` em Swarm, evitando Compose standalone para o deploy final.

### 2026-05-21 — env example e secrets de produção

- `.env.example` deve usar apenas placeholders seguros e não deve conter valores reais de produção.
- `.env.production` será gerado pelo workflow de deploy a partir das secrets do GitHub Environment `production`.
- O domínio público real fica para documentação e secrets, nunca como valor real em `.env.example`.

### 2026-05-21 — produção Swarm 1.3.31

- A produção do VisioMilhas usará Docker Swarm e o Traefik existente via rede `traefik_public`.
- O acesso externo não deve expor a porta 3000 no host.
- O `certresolver` do Traefik identificado na auditoria é `le`.
- O primeiro deploy pode construir a imagem no servidor antes do `docker stack deploy`, sem registry obrigatório nesta etapa.

### 2026-05-21 — workflow manual de deploy 1.3.32

- O deploy de producao sera acionado manualmente via `workflow_dispatch`.
- O workflow sincroniza o repositorio para `/opt/datavisio/visiomilhas` e gera `.env.production` no host.
- A imagem e construida no servidor com tag `GITHUB_SHA` antes do `docker stack deploy`.
- O workflow nao executa migrations ou seeds.

Skills detectadas: `code-review`, `frontend-patterns`, `saas-multi-tenant`, `security-review`, `test`.

### 2026-05-24 — 2.2-I AI Knowledge & Skill Consolidation

- Decisão: `docs/ai-context`, `docs/specs` e `docs/ai-skills` formam a fonte de verdade estrategica da governanca IA-First.
- Decisão: `.claude/skills` e `.github/agents` pertencem a camada operacional IA e devem apenas operacionalizar o que os docs oficiais já definiram.
- Decisão: skills e agents nao podem redefinir arquitetura, auth, ownership, permissões ou deploy.
- Decisão: qualquer drift entre docs, skills e agents deve ser registrado em `CHANGELOG_AI.md` e `DAILY_CHECKPOINT.md` antes de novas mudanças operacionais.
- Decisão: `AI_OPERATING_MODEL_VERSION=2.2-I` é a baseline oficial ativa da governança IA.
- Decisão: skills versionadas usam baseline `v1` e agents versionados usam baseline `v1`, ambos compatíveis com `2.2-I`.
### 2026-06-02 - Docker Runtime Layout Collision Fix

- Decisao: o build containerizado do VisioMilhas nao deve usar `WORKDIR /app`, para evitar colisao com a arvore App Router `app/` e rotas internas `app/app/`.
- Decisao: o Dockerfile passa a usar `WORKDIR /workspace` e todos os caminhos absolutos derivados devem acompanhar esse diretorio.
- Motivo: producao apresentou HTML sem `<!DOCTYPE html>` e erros React de hidratacao apos o standalone build containerizado, enquanto local dev, build e standalone sem Docker permaneceram corretos.
- Escopo: nao alterar Subscribe, Auth, layouts fonte, providers, billing ou regras de subscription para este fix.

### 2026-06-02 - Runtime Forensics antes de investigacao frontend

- Decisao: incidentes com tela branca, hydration failure, React #418, React #423, `HierarchyRequestError`, `NotFoundError` ou `document.doctype = null` devem seguir primeiro o fluxo Runtime Forensics -> HTML Validation -> Container Validation -> Deploy Validation -> Proxy Routing Validation.
- Decisao: agentes so devem investigar componentes React depois de provar que o HTML bruto contem `<!DOCTYPE html>`, que `document.doctype` existe, que o container ativo usa a imagem esperada e que o proxy aponta para o backend correto.
- Motivo: o incidente `KB-0001` provou que sintomas de hidratacao React podem ser causados por artefato Docker/deploy, e nao por componente frontend.
- Artefatos oficiais: `docs/ai-context/knowledge-base/KB-0001-DOCKER-WORKDIR-APP-ROUTER-COLLISION.md` e `.agents/skills/runtime-deploy-forensics/SKILL.md`.

### 2026-06-02 - Auth bootstrap environment hardening

- Decisao: o deploy de producao deve falhar imediatamente se `BETTER_AUTH_SECRET` e `AUTH_SECRET` estiverem ambos vazios.
- Decisao: `BETTER_AUTH_SECRET` passa a ser o segredo primario do Better Auth em producao; `AUTH_SECRET` continua como fallback tecnico, nao como substituto silencioso de um env vazio.
- Motivo: a producao retornou `AUTH_BOOTSTRAP_FAILED` porque o processo Node recebeu `BETTER_AUTH_SECRET` vazio, apesar de outros segredos estarem presentes.
- Resultado esperado: o provider Google so inicializa com um segredo valido e nao vazio.
# 2026-06-03

## Final discovery decisions before implementation

- Better Auth must be treated as requiring provisioning before an empty production database can be considered ready.
- MongoDB is not part of the current required runtime path.
- The production deploy pipeline must be validated end-to-end through GitHub Actions -> SSH -> Docker -> Traefik -> container -> public URL.
- Healthcheck, auth runtime events, and post-deploy smoke tests are mandatory gates for readiness.
# 2026-06-04

- Adopted a Failure Recovery Layer as part of the delivery workflow.
- Agents must consult the failure registry and run the matching recovery playbook before returning `FAIL`.
- Local execution/runtime failures should be reclassified to `WARNING` when the issue is agent-side or environment-side rather than a SaaS defect.
- Playwright browser automation is available and must run in an isolated lane from Vitest/unit automation.
- Adopted an Autonomous Delivery Engine flow for HM/PROD delivery: implement, test, validate, fix, retest, document, classify, continue, and only escalate to humans for credentials, business decisions, or destructive actions.
- Standardized `DEPLOY_CONFIDENCE_SCORE` across Infrastructure, Authentication, Smoke, Functional, and Runtime categories for HM and PROD.
- Formalized the test suite organization contract: `tests/domain` for pure unit rules, `tests/integration` for persistence/service checks, `tests/runtime` for browser-like journeys, `tests-e2e` only for a future dedicated browser lane, and `test-results` for artifacts only.
