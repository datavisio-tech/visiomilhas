# VisioMilhas - MVP1

Projeto: VisioMilhas
Empresa: DataVisio

Descrição resumida:
Plataforma SaaS para gestão de milhas/pontos de fidelidade com multi-tenant por organização.

Stack:

- Frontend: Next.js (App Router)
- Language: TypeScript
- UI: Tailwind CSS
- ORM: Drizzle ORM (Postgres)

Arquitetura de banco:

- ADM database: controle_adm_saas_datavisio
- APP database: visiomilhas_app
- Observação: usam-se duas databases separadas (ADM / APP) — não consolidar em um único DB com schemas.

Versão operacional atual: 1.2.2

Status do MVP1:

- Técnico / base: 72%–77%
- Utilizável por usuário: 48%–58%
  Versão operacional atual: 1.2.3

- Técnico / base: 74%–78%
- Utilizável por usuário: 50%–60%

Comandos principais:

```
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
npm run db:check-env
npm run db:check-connections
npm run db:seed (exige autorização explícita)
```

Status das validações (local):

- `npm run test`: OK (14 testes unitários do domínio)
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Próximos passos (curto prazo):

- Conectar `/app/accounts` ao banco real (1.2.3)
- Conectar `/app/entries` e `/app/programs` melhorias (1.2.x)
- Implementar autenticação e CRUD completo

Passos iniciais para rodar local:

1. Preencher `.env.local` com as variáveis em `.env.example` (NÃO commitar `.env.local`).
2. Rodar `npm ci`.
3. `npm run dev`.

Observações de segurança:

- Não versionar `.env`.
- Não expor `APP_DATABASE_URL` / `ADM_DATABASE_URL` em logs.
