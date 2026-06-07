# VisioMilhas Architecture

## Product architecture

- Next.js App Router
- TypeScript strict
- Drizzle ORM
- Better Auth
- Docker
- Traefik
- GitHub Actions
- Playwright for browser validation

## Environment architecture

### DEV

- Local development
- Uses the local browser and local runtime
- No production promotion

### HM

- Homologation and release-candidate validation
- Receives promoted release artifacts first
- Uses the `hm` GitHub Environment

### PROD

- Customer-facing production
- Receives the exact same artifact promoted in HM
- Uses the `production` GitHub Environment with approval rules

## Release architecture

- Build happens once in CI.
- The built Docker image is saved as a release artifact.
- HM deploys the artifact first.
- HM smoke and integration validation must pass.
- RC releases are published as GitHub pre-releases.
- Production releases require human approval, deploy the same artifact, then publish the GitHub Release as latest.

## Legacy paths

- `deploy-hm.yml` and `deploy-prod.yml` remain as legacy fallback workflows only.
- Official release promotion happens through `release-promotion.yml`.

## Política de Uso de Modelos de IA (resumo técnico)

Para decisões de arquitetura, segurança e deploy, a DataVisio usa um modelo de alto-falante (GPT-5) com uso restrito e auditoria humana. Para atividades de engenharia e documentação usar preferencialmente Gemini 2.5 Pro; tarefas repetitivas e geração de artefatos usar Gemini Flash / GPT-5 Mini.

Regras rápidas:
- Arquitetura crítica, mudanças de deploy e cutover HM→PROD: revisar com GPT-5 e registrar decisão em `docs/ai-context/DECISIONS.md`.
- Mudanças de infra ou mergem em `main` exigem aprovação humana explícita.

Data de vigência: 2026-06-07
