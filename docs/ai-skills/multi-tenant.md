# multi-tenant skill

SKILL_VERSION=v1
COMPATIBLE_WITH=AI_OPERATING_MODEL_VERSION=2.2-I
STATUS=operational

Quando usar:

- Organization/ownership scope, isolacao de dados e consultas multi-tenant.

Quando nao usar:

- Features que nao tocam dados ou autorizacao.

Saida esperada:

- Dados isolados por escopo logico, sem vazamento entre contas.

Guardrails:

- Toda query sensivel precisa explicitar o escopo.
