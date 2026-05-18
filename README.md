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

Versão operacional atual: 1.3.11

Status do MVP1:

- Técnico / base: 81%–85%
- Utilizável por usuário: 60%–68%

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

- Conectar `/app/entries` ao banco real (1.2.4)
- Conectar compras/vendas/transferências e CRUDs (1.2.5+)
- Implementar autenticação e deploy

Passos iniciais para rodar local:

1. Preencher `.env.local` com as variáveis em `.env.example` (NÃO commitar `.env.local`).
2. Rodar `npm ci`.
3. `npm run dev`.

Observações de segurança:

- Não versionar `.env`.
- Não expor `APP_DATABASE_URL` / `ADM_DATABASE_URL` em logs.

Notas da versão 1.3.11 (pausa arquitetural):

- Commit local: integração dos formulários UI (1.3.10) e análise arquitetural do motor de milhas para 1.3.11.
- Status: pausa para reavaliação do motor de milhas (ledger + point_lots) antes de continuar com refatorações e implementação de FIFO real.
- Motivo: o blueprint técnico indica necessidade de `mile_point_lots` (lotes) e regras FIFO para vendas e transferências; a implementação atual atualiza saldos diretamente e não mantém lotes detalhados.
- Observação técnica: foi detectado um problema de runtime ao reutilizar Server Actions diretamente em API Routes (`TypeError: Cannot redefine property: $$id`). Isso será resolvido em uma refatoração futura ao introduzir services compartilhados que apliquem a lógica transacional.
- Pendências: modelagem de `mile_point_lots`, motor FIFO, refatoração para services compartilhados, testes manuais e unitários para regras de custo FIFO.

Notas da versão 1.2.8:

- Corrigido warning ESLint em `lib/data/db-errors.ts` (remoção de export default anônimo).
- `/app/clubs` agora consulta `mile_clubs` no APP DB via `lib/data/clubs.ts` (Server Component, fallback seguro quando tabela ausente).
- `/app/settings` revisado para indicar tela preparatória sem persistência.
- Mantida separação: `organizations` resolvido via ADM; produto via APP.
- Recomenda-se remover fallbacks de desenvolvimento antes do deploy de produção.

Módulos conectados ao banco real:

- dashboard
- programs
- accounts
- entries
- purchases
- sales
- transfers
- clubs
