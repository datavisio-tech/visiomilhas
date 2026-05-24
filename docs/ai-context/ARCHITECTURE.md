# ARCHITECTURE - VisioMilhas (resumo)

Overview:

- Aplicação Next.js com App Router, priorizando Server Components quando apropriado e APIs/Server Actions para mutações.

Modelo de produto:

- SaaS B2C com assinatura individual mensal recorrente.
- Identidade propria VisioMilhas, sem white-label enterprise.
- Uma experiencia principal por usuario, com organization_id mantido por compatibilidade arquitetural e evolucao futura.

Separação de áreas:

- Área pública: landing, pricing, páginas públicas.
- Área auth: páginas de login/registro/recuperação.
- Área app (autenticada): /app/\* com proteção por middleware e verificação de tenant/membership.

Multi-tenancy:

- Isolamento logico forte por usuario/conta.
- Validacao de ownership/membership no servidor para operacoes mutaveis.
- Filtros obrigatorios por organizationId/owner scope nas consultas do produto.
- A camada de banco deve evoluir para enforcement adicional quando a estrategia de auth e tenancy estiver consolidada.

Bases de dados:

- Base administrativa (control_adm_saas_datavisio): usuários globais, organizações, planos, assinaturas, billing, integrações OAuth, audit.
- Base específica (visiomilhas_app): programas, contas, saldos, lançamentos, compras, vendas, transferências, clubes, beneficiários.

Autenticação & Identidade:

- Escolha: Auth.js/NextAuth (ver DECISIONS.md para justificativa).
- Suportar email/senha + Google OAuth.
- Senhas armazenadas de forma segura (bcrypt/argon2) via adaptador/driver da biblioteca escolhida.
- Permissoes simplificadas nesta fase: usuario comum e admin interno da plataforma.

Billing & Trial:

- Billing individual por assinatura mensal recorrente.
- Estrutura inicial para Stripe: customers, subscriptions, webhooks preparados.
- Trial de 15 dias criado no onboarding e registrado em `subscriptions` na base administrativa.
- A aplicacao administrativa global da DataVisio permanece desacoplada do produto.

Segurança e isolamento:

- Todas as consultas do produto filtram por `organizationId`.
- Nunca confiar em organizationId do cliente sem validação do membership.

Domain & Validation layer:

- A aplicação inclui uma camada `lib/domain` com funções puras e erros de domínio para cálculos e lógica de milhas.
- Validações de entrada estão em `lib/validations` usando Zod; essa camada protege rotas e Server Actions contra entrada inválida.

- Permissões por papel (owner/admin/viewer) antes de mutações.

Deploy:

- CI via GitHub Actions (lint, typecheck, build).
- Deploy remoto via GitHub Actions para a VPS Hostinger existente.
- Reutilizar o Traefik existente após auditoria; não criar novo proxy reverso.
- O deploy final deve usar o usuário SSH `gitdatavisiodeploy` e publicar em `/opt/datavisio/visiomilhas`.
- O workflow de produção deve rodar em `environment: production` e gerar `.env.production` no host remoto.
- Auditoria 1.3.30 confirmou Swarm ativo; a estratégia recomendada passa a ser `docker stack deploy` com a rede `traefik_public`.
- A etapa 1.3.31 adiciona Dockerfile, `.dockerignore`, `stack.visiomilhas.yml` e healthcheck para suportar o caminho Swarm.
- A etapa 1.3.32 cria o workflow manual de deploy que sincroniza o repo via rsync, faz build no servidor e aplica `docker stack deploy`.

Observabilidade:

- Observabilidade minima inicialmente: logs basicos, healthcheck, rastreio de erros criticos e diagnostico operacional.
- Evitar stack pesada de observabilidade no inicio.

IA-First:

- A governanca IA-First sera composta por docs/ai-context, docs/specs e docs/ai-skills.
- O produto nao tera IA interna como prioridade de primeira etapa; a IA aqui e de desenvolvimento e operacao.
- A arquitetura de desenvolvimento deve favorecer prompt reuse, contexto persistente e tarefas pequenas e testaveis.
- O operating model consolidado fica em `AI_OPERATING_MODEL.md` e define quando usar Context, Specs, Skills, Agents e Prompts.
- A baseline oficial do modelo eh `AI_OPERATING_MODEL_VERSION=2.2-I`, com skills v1 e agents v1.
- `docs/specs` define contratos; `docs/ai-skills` especializa execucao; `.claude/skills` e `.github/agents` apenas operacionalizam o que os docs oficiais ja decidiram.
- Em escrita, `organizationId` é contexto derivado no servidor; `orgSlug` não deve ser usado como boundary de cliente.

Observações operacionais:

- Logs e auditoria centralizados na base administrativa quando aplicável.
- MongoDB reservado para logs/eventos/IA em fases futuras (documentado em ENVIRONMENT.md).
