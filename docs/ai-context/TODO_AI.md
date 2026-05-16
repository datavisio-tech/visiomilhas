# TODO_AI - Pendências e próximas ações

Prioridades imediatas:

1. Scaffold do projeto Next.js + TypeScript + Tailwind + shadcn/ui
2. Criar schemas Drizzle para `control_adm_saas_datavisio` e `visiomilhas_app`
3. Implementar autenticação (Auth.js/NextAuth) e onboarding com trial de 15 dias
4. Seeds iniciais (planos e programas de fidelidade)

Pendências de integração:

- Configurar Stripe em ambiente de teste (webhooks de staging)
- Configurar CI (GitHub Actions) com secrets seguros

Funcionalidades futuras (backlog):

- Importação CSV/Excel
- Relatórios avançados e dashboards customizáveis
- Integração com MongoDB para logs/eventos/IA
- Importadores e conectores para programas específicos (quando permitido)

Notas operacionais:

- Validar preços e intervals de cobrança como configuração via seed/env.
- Priorizar testes de multi-tenant e isolamento de dados.

Concluído recentemente:

- Implementar camada de domínio e validações Zod (lib/domain, lib/validations).

Próximos itens prioritários:

- Criar testes unitários para `lib/domain`.
- Implementar Server Actions / API routes que utilizem as validações e domínio.
- Implementar UI inicial do dashboard e CRUDs.
- Integrar autenticação e onboarding.
- Configurar Stripe e billing.
  \
  Status recente:

- `.gitignore` e `.env.example` criados na raiz do projeto com placeholders seguros (16/05/2026).
- Testes unitários do domínio adicionados com Vitest. Arquivos em `tests/domain` (16/05/2026).

Próximo passo recomendado: provisionar `.env.local` em staging/production e configurar secrets no CI.

Status: padronização do runtime

- Arquivos `.nvmrc` e `.node-version` adicionados com `24`.
- Atualizar ambiente local para Node 24 e rodar `npm install` + `npm run test`.

DB: status recente (2026-05-16):

- Migrations iniciais geradas e aplicadas para ADM e APP (ver `db/adm/migrations/0000_strange_thor_girl.sql` e `db/app/migrations/0000_misty_kulan_gath.sql`).
- Seeds: pendentes — não foram executados nesta etapa e exigem autorização explícita para rodar.

DB: migrações, generate e seeds

- Adicionar script seguro `db:create-databases` e variável `POSTGRES_ADMIN_DATABASE_URL` usada para criar apenas as bases necessárias (`controle_adm_saas_datavisio` e `visiomilhas_app`) quando ausentes. O admin URL é sensível e requerido apenas para esta operação.
