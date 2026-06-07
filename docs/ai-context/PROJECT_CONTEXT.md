# VisioMilhas Project Context

## Current state

- HM is validated and operational.
- Better Auth, Google OAuth, PostgreSQL, MongoDB, GitHub Actions, and Playwright are operational.
- The project is moving from independent HM/PROD deploy thinking to a release-first promotion pipeline.

## Official release model

- Releases are now the primary operational unit.
- HM is the release-candidate validation environment.
- Production is the human-approved promotion target.
- Build Once, Promote Many is the release contract.
- The same image artifact is promoted from HM to PROD.

## Environment model

- DEV: local development and exploratory validation.
- HM: homologation, smoke, and integration validation.
- PROD: customer-facing production after human approval.

## Release cadence

- RC tags use semantic pre-release forms such as `v2.0.0-rc.1` and `v2.0.0-beta.1`.
- Production tags use final semantic versions such as `v2.0.0` and `v2.0.1`.

## Política Oficial de Uso de Modelos de IA — DataVisio

A DataVisio adota a seguinte política de utilização de modelos de IA, com objetivo de reduzir custo operacional e evitar ciclos repetitivos de investigação:

- **Modelo Principal de Implementação**: Gemini 2.5 Pro — uso para desenvolvimento diário (Next.js, TypeScript, React, Tailwind, shadcn/ui, APIs, Drizzle, MongoDB, CRUD, refatorações, documentação técnica comum).
- **Modelo Econômico**: Gemini Flash ou GPT-5 Mini — uso para arquivos, markdown, changelog, documentação, testes simples e tarefas repetitivas.
- **Modelo de Arquitetura e Decisão Crítica**: GPT-5 — uso restrito a arquitetura, segurança, CI/CD, incidentes críticos, RCAs complexas e decisões estruturais.

Regras operacionais:

- Máximo 1 RCA por incidente; nova RCA somente com evidência adicional.
- Agentes consultam `failure-registry` e `docs/ai-context/DECISIONS.md` antes de investigar.
- Autonomia: commits/push/merge para `develop` permitidos; merges para `main` e deploys PROD exigem aprovação humana.

Data de vigência: 2026-06-07
