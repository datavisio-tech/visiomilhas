# database-patterns skill

SKILL_VERSION=v1
COMPATIBLE_WITH=AI_OPERATING_MODEL_VERSION=2.2-I
STATUS=operational

Quando usar:

- Drizzle, PostgreSQL, migrations, queries, indices e integridade.

Quando nao usar:

- UI ou fluxos de login sem impacto de banco.

Saida esperada:

- Schema simples, consistente e compatível com evolucao incremental.

Guardrails:

- Evitar migrations desnecessarias e manter separacao ADM/APP quando aplicavel.
