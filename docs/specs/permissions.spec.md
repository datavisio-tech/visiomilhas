# permissions.spec

Status: draft

Objetivo:

- Definir o modelo simplificado de permissões e boundaries de ownership.

Estado atual:

- O projeto ainda nao tem RBAC consolidado.
- A fase 2.2-G nao introduz novo framework de permissao; o limite continua simplificado e centrado em ownership server-side.
- A fase 2.2-I reforça que skills e agents nao podem redefinir o modelo de permissao; eles apenas operacionalizam o boundary oficial descrito nos docs.

Decisao alvo:

- Usuario comum.
- Admin interno da plataforma.
- Sem RBAC enterprise.

Riscos:

- Criar complexidade de permissao antes da necessidade real.
- Misturar permissao com ownership.

Proximo passo:

- Mapear quais rotas e mutacoes exigem admin interno e quais pertencem ao usuario comum.
- Documentar o limite entre permissao administrativa e ownership de recurso.
