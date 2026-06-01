# PROJECT_CONTEXT - VisioMilhas

Release operacional atual:

- 4.3-C — Campaign Catalog Engine consolidou um novo domínio em `src/modules/campaigns`, adicionou enums/tabelas de catálogo para campanhas parceiras, criou seed JSON com exemplos de Livelo, Azul, Smiles, LATAM Pass e Esfera, e preparou providers vazios para futuras integrações sem scraping automático nesta fase.
- 4.3-B.2.A — Purchases agora está sendo transformado em cockpit operacional baseado em Kanban, com visualização principal em colunas, drag & drop, criação de compra bonificada e validação MCP no runtime real.
- A tela `/app/purchases` continua como entrada do módulo, mas passa a priorizar o fluxo REGISTERED → TRACKED → PENDING_CREDIT → RECEIVED / PROBLEM.
- A integração de RECEIVED cria `PURCHASE_BONUS` de forma idempotente e atualiza conta, programs e dashboard.
- A validação oficial desta release usou `npm run purchases -- emailteste01` no runtime real com Chrome DevTools MCP e passou.

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

Diretriz atual de autenticação (3.7-B):

- `/sign-in` opera como hub unificado de autenticação, mantendo Google como fluxo principal.
- Fallback por credenciais (entrar/cadastrar/recuperar) ocorre via modais na mesma tela premium.
- A única página adicional do fluxo é `/reset-password`, acionada por token temporário de recuperação.
- O fluxo de recuperação não revela se o e-mail existe na base.

Diretriz visual atual de `/sign-in` (3.7-C):

- A tela deve separar explicitamente Marketing e Operação em desktop.
- O lado esquerdo preserva a leitura premium escura de marketing.
- O lado direito representa o ambiente operacional claro, com CTA principal de Google e mini preview de dashboard.
- Em tablet e mobile, a autenticação deve vir primeiro e o marketing abaixo.

Diretriz visual refinada de `/sign-in` (3.7-D):

- A transição entre marketing e operação deve parecer uma única plataforma, não duas telas coladas.
- O preview de marketing pode exibir dados fictícios e movimentações recentes apenas para reforço de produto.
- A cópia principal deve privilegiar posicionamento premium e operacional, não linguagem genérica de landing.
- O card de acesso deve incluir sinais sutis de confiança, sem invadir o fluxo de autenticação.

Diretriz visual atualizada de `/sign-in` (3.7-E):

- A coluna esquerda é a única responsável pela conversão e pode concentrar mockups, KPIs fictícios e storytelling.
- A coluna direita é uma superfície de autenticação pura, sem benefícios, checklists ou preview de produto.
- Os links de criação, recuperação e termos devem existir como apoio de acesso, sem introduzir novos contextos visuais.
- O espaço de login deve preservar leitura minimalista e clara, com forte separação semântica entre venda e entrada.

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

Validação operacional de autenticação:

- A validação oficial de autenticação e sessão do VisioMilhas deve usar o runtime real de desenvolvimento e o Chrome DevTools MCP.
- Toda mudança em autenticação, sessão, onboarding ou proteção de rotas deve executar a bateria documentada em `docs/testing/AUTH_INTEGRATION_CHECKLIST.md` antes de qualquer merge para `main`.
- Os usuários de teste oficiais ficam em `docs/testing/AUTH_TEST_USERS.md`.
- Os resultados de cada rodada devem ser registrados em `docs/testing/AUTH_RUNTIME_REPORT_TEMPLATE.md`.

IA-First operacional:

- A stack IA-First do projeto e operacional/de desenvolvimento, nao uma promessa de IA dentro do produto.
- O foco e previsibilidade, memoria persistente, padronizacao de prompts/specs, agentes controlados e baixo retrabalho.
- O monolito modular continua sendo a base tecnica; microservicos nao sao prioridade.
- O documento consolidado de governanca e operacao e `AI_OPERATING_MODEL.md`, que amarra Context, Specs, Skills, Agents e Prompts.
- `AI_OPERATING_MODEL_VERSION=2.2-I` é a baseline oficial ativa da governança IA.
- `docs/specs`, `docs/ai-skills`, `.claude/skills` e `.github/agents` formam uma cadeia: docs definem a verdade, skills operacionalizam e agents orquestram.
- Referencia visual e comportamental para novas telas: `docs/ai-context/UI_PATTERNS.md`.
- Os fluxos de escrita nao devem aceitar `orgSlug` como boundary; `organizationId` deve ser derivado no servidor.

Versionamento operacional

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`)
- MVP: 1 (MVP1)
- Funcionalidade/etapa atual: 1.1 — Fundação técnica, banco, migrations e seed inicial
- Versão operacional atual registrada: `1.1.6`
- Próxima versão incremental será: `1.1.7`

Atualização de cockpit:

- Programs foi promovido de visão contextual para cockpit operacional em 4.2-B.

## 2026-05-29 — Release 4.2-B.1 — Programs UX Refinement

- Objetivo: Refinamento visual e UX do Cockpit operacional (4.2-B.1). Reduzir header, mover seletor de conta para dentro do header, priorizar extrato no resumo, substituir timeline por tabela operacional, reintroduzir sidebar contextual compacta, adicionar breadcrumb e ação rápida de troca de conta no header, e validar responsividade em 1920/1440/1366/tablet.

Notas: alterações implementadas no branch `4.2-b-programs-operational-cockpit` e documentação vinculada em `docs/ai-context`.

- Atualização: o header de Programs passou a ser compacto e executivo, com breadcrumb, seletor de conta embutido, ação `Trocar conta` e métricas resumidas, enquanto os cards operacionais abaixo passaram a priorizar resultado, pendências, compras, vendas e transferências.
