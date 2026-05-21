# ARCHITECTURE - VisioMilhas (resumo)

Overview:

- Aplicação Next.js com App Router, priorizando Server Components quando apropriado e APIs/Server Actions para mutações.

Separação de áreas:

- Área pública: landing, pricing, páginas públicas.
- Área auth: páginas de login/registro/recuperação.
- Área app (autenticada): /app/\* com proteção por middleware e verificação de tenant/membership.

Multi-tenancy:

- Modelo por organização (tenant) com `organizationId` presente em todas as tabelas de negócio.
- Validação de membership no servidor para todas as operações mutáveis.

Bases de dados:

- Base administrativa (control_adm_saas_datavisio): usuários globais, organizações, planos, assinaturas, billing, integrações OAuth, audit.
- Base específica (visiomilhas_app): programas, contas, saldos, lançamentos, compras, vendas, transferências, clubes, beneficiários.

Autenticação & Identidade:

- Escolha: Auth.js/NextAuth (ver DECISIONS.md para justificativa).
- Suportar email/senha + Google OAuth.
- Senhas armazenadas de forma segura (bcrypt/argon2) via adaptador/driver da biblioteca escolhida.

Billing & Trial:

- Estrutura inicial para Stripe: customers, subscriptions, webhooks preparados.
- Trial de 15 dias criado no onboarding e registrado em `subscriptions` na base administrativa.

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

Observações operacionais:

- Logs e auditoria centralizados na base administrativa quando aplicável.
- MongoDB reservado para logs/eventos/IA em fases futuras (documentado em ENVIRONMENT.md).
