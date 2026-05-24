# PROJECT_CONTEXT - VisioMilhas

Produto: VisioMilhas

Objetivo:

- Construir um SaaS B2C acessível para gerenciamento de milhas, pontos e estratégias de acúmulo, com baixo custo por usuario, simplicidade operacional e evolucao incremental.

Público-alvo:

- Pessoas fisicas que acumulam milhas
- Milheiros
- Viajantes
- Acumuladores de pontos
- Usuarios finais que compram, transferem e vendem milhas/pontos

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
- Estrutura basica de billing individual recorrente

Escopo fora do MVP1:

- Importação massiva (CSV/Excel)
- IA/Modelos e simulacoes avancadas dentro do produto
- Automatizacoes especificas por provedor
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

- Separar dados administrativos compartilhados (control_adm_saas_datavisio) e dados especificos (visiomilhas_app).
- Trial full: 15 dias por conta/assinatura.
- Modelo de cobranca: individual mensal recorrente.
- Identidade propria VisioMilhas, sem estrategia white-label.
- Permissoes simplificadas: usuario comum e admin interno.

Deploy de produção:

- Deploy remoto via GitHub Actions para a VPS Hostinger já existente.
- Usuário SSH de deploy: `gitdatavisiodeploy`.
- Diretório remoto: `/opt/datavisio/visiomilhas`.
- Domínio de produção: `https://visiomilhas.visiochat.cloud`.
- GitHub Environment `production` já criado e com secrets cadastradas pelo operador.
- O workflow final deve gerar `.env.production` no servidor e não versionar esse arquivo.
- A produção inicial deve começar com `USE_FIFO_MOVEMENTS_ENGINE=0`.
- Antes do deploy final, auditar Docker, Docker Compose/Swarm, Portainer e Traefik existentes.

Observações:

- Codigo e identidade visual proprios; nao copiar codigo proprietario de terceiros.

IA-First operacional:

- A stack IA-First do projeto e operacional/de desenvolvimento, nao uma promessa de IA dentro do produto.
- O foco e previsibilidade, memoria persistente, padronizacao de prompts/specs, agentes controlados e baixo retrabalho.
- O monolito modular continua sendo a base tecnica; microservicos nao sao prioridade.
- O documento consolidado de governanca e operacao e `AI_OPERATING_MODEL.md`, que amarra Context, Specs, Skills, Agents e Prompts.
- `AI_OPERATING_MODEL_VERSION=2.2-I` é a baseline oficial ativa da governança IA.
- `docs/specs`, `docs/ai-skills`, `.claude/skills` e `.github/agents` formam uma cadeia: docs definem a verdade, skills operacionalizam e agents orquestram.
- Os fluxos de escrita nao devem aceitar `orgSlug` como boundary; `organizationId` deve ser derivado no servidor.

Versionamento operacional

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`)
- MVP: 1 (MVP1)
- Funcionalidade/etapa atual: 1.1 — Fundação técnica, banco, migrations e seed inicial
- Versão operacional atual registrada: `1.1.6`
- Próxima versão incremental será: `1.1.7`
