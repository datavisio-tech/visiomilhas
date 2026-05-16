# DECISIONS - VisioMilhas

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
