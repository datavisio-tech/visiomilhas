# PROJECT_CONTEXT - VisioMilhas

Produto: VisioMilhas

Objetivo:

- Construir um MVP1 de uma plataforma SaaS para controle financeiro e operacional de milhas, fornecendo saldos, custo médio do milheiro, registro de compras/vendas/transferências e dashboards básicos.

Público-alvo:

- Pessoas físicas que acumulam milhas
- Milheiros profissionais
- Usuários avançados que compram, transferem e vendem milhas/pontos

Módulos do MVP1:

- Landing page pública e trial de 15 dias
- Autenticação (email/senha + Google OAuth)
- Onboarding e criação de organização (tenant)
- Multi-tenancy básico
- Dashboard inicial com métricas e gráficos
- Cadastro de programas de fidelidade
- Contas por programa
- Lançamentos (mile_entries)
- Compras, Vendas, Transferências
- Clubes (assinaturas de pontos) — geração manual de crédito
- Estrutura básica de billing (Stripe)

Escopo fora do MVP1:

- Importação massiva (CSV/Excel)
- IA/Modelos e simulações avançadas
- Automatizações específicas por provedor
- Relatórios analíticos avançados

Domínio: visiomilhas.visiochat.cloud
Repositório: https://github.com/datavisio-tech/visiomilhas

Stack (obrigatória no MVP1):

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui
- PostgreSQL + Drizzle ORM
- Zod
- Stripe
- Autenticação Email/Senha + Google OAuth
- GitHub Actions

Decisões iniciais:

- Separar dados administrativos compartilhados (control_adm_saas_datavisio) e dados específicos (visiomilhas_app).
- Trial full: 15 dias por organização.
- Modelo de cobrança: por organização/plano.

Observações:

- Código e identidade visual próprios; não copiar código proprietário de terceiros.

Versionamento operacional

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`)
- MVP: 1 (MVP1)
- Funcionalidade/etapa atual: 1.1 — Fundação técnica, banco, migrations e seed inicial
- Versão operacional atual registrada: `1.1.6`
- Próxima versão incremental será: `1.1.7`
