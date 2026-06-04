# KB-0001 - Docker WORKDIR x Next.js App Router Collision

## Resumo Executivo

Em 2026-06-02, o VisioMilhas apresentou tela branca em producao apos o carregamento inicial. A investigacao confirmou que o container Docker era construido com `WORKDIR /app` em um projeto Next.js App Router que tambem possui a arvore `app/` e rotas internas em `app/app/`.

Essa combinacao gerou colisao estrutural no build/runtime standalone containerizado. O HTML servido em producao perdeu o `<!DOCTYPE html>`, o browser entrou em uma hidratacao invalida e o React gerou erros minificados.

A correcao foi alterar o `WORKDIR` do Dockerfile para `/workspace` e ajustar todos os caminhos derivados. O deploy do commit `83cf2fd` eliminou a tela branca.

## Sintomas

- Tela branca apos alguns segundos de carregamento.
- `React #418`.
- `React #423`.
- `HierarchyRequestError`.
- `NotFoundError`.
- `document.doctype = null`.
- HTML bruto iniciando diretamente com `<meta ...` em vez de `<!DOCTYPE html>`.

## Impacto

As rotas afetadas incluiam:

- `/`
- `/sign-in`
- `/subscribe`
- `/app/accounts`
- `/app/purchases`

O impacto visual atingiu login, assinatura, contas e compras. A aplicacao ficava tecnicamente respondendo, mas inutilizavel no navegador.

## Evidencias

Antes da correcao:

- Container ativo: `visiomilhas_app`.
- Imagem ativa: `datavisio/visiomilhas:442d21394e20a74f4f5ba360f74cbbb19ead96c2`.
- `WorkingDir`: `/app`.
- Healthcheck: `["CMD","node","/app/scripts/healthcheck.js"]`.
- HTML interno do container:

```html
<meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
```

- Chrome/CDP:
  - `document.doctype = null`.
  - `React #418` presente.
  - `React #423` presente.
  - `HierarchyRequestError` presente.
  - `NotFoundError` presente.

Depois da correcao:

- Commit: `83cf2fd`.
- Mensagem: `fix(infra): corrige workdir do container para evitar colisao com App Router`.
- Imagem ativa: `datavisio/visiomilhas:83cf2fd90e24bfde04034a0577c0fcbc15c9d641`.
- `WorkingDir`: `/workspace`.
- Healthcheck: `["CMD","node","/workspace/scripts/healthcheck.js"]`.
- HTML bruto:

```html
<!DOCTYPE html><html lang="pt-BR">
```

- Chrome/CDP:
  - `document.doctype = true`.
  - `React #418` ausente.
  - `React #423` ausente.
  - `HierarchyRequestError` ausente.
  - `NotFoundError` ausente.

## Hipoteses Investigadas

- Erro em componente React da Subscribe.
- Uso indevido de `<html>` ou `<body>` fora de `app/layout.tsx`.
- Portal, dialog, toast ou overlay manipulando `document.body`.
- Erro de Auth, Subscription ou Billing.
- Problema de Traefik.
- Cache ou artefato antigo no servidor.
- Colisao entre `WORKDIR /app` e a arvore App Router `app/`.

## Hipoteses Descartadas

- Subscribe: `ActivateTrialButton.client.tsx` nao manipulava DOM nem renderizava estruturas de documento.
- Auth/Subscription/Billing: os sintomas eram de hidratacao/DOM, nao `401`, `403`, `500` ou redirect incorreto.
- Traefik: o HTML invalido ja era gerado dentro do container ao acessar `http://container:3000`.
- Layout fonte: `app/layout.tsx` e `app/app/layout.tsx` estavam corretos no codigo fonte.
- Standalone local sem Docker: nao reproduzia a falha.

## Causa Raiz

O Dockerfile usava:

```dockerfile
WORKDIR /app
```

O projeto Next.js App Router tambem possuia:

```txt
app/
app/app/
```

No container, isso produzia caminhos com alta ambiguidade estrutural, como:

```txt
/app/app
/app/app/app
```

O build/runtime standalone containerizado passou a servir uma estrutura de documento invalida. Como consequencia, o HTML perdia o `<!DOCTYPE html>` e o React tentava hidratar um DOM incompatibilidade com o esperado.

## Correcao Aplicada

O Dockerfile foi alterado para:

```dockerfile
WORKDIR /workspace
```

Tambem foram atualizados os caminhos derivados:

```dockerfile
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=builder /workspace/public ./public
COPY --from=builder /workspace/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static
HEALTHCHECK ... ["node", "/workspace/scripts/healthcheck.js"]
```

## Validacao

Validacoes locais:

- `npm run lint`: passou com warnings antigos de `<img>`.
- `npm run typecheck`: passou.
- `npm run build`: passou.
- Standalone local: rotas retornaram `<!DOCTYPE html>`.

Validacoes de producao:

- Workflow `Production Deploy - VisioMilhas`: sucesso.
- Run: `26836797556`.
- Container ativo executando `/workspace`.
- HTML de `/`, `/sign-in`, `/subscribe`, `/app/accounts`, `/app/purchases` com `DOCTYPE`.
- Chrome headless/CDP sem `React #418`, `React #423`, `HierarchyRequestError` ou `NotFoundError`.

## Licoes Aprendidas

- Em Next.js App Router, evitar `WORKDIR /app` quando o projeto usa a pasta `app/`.
- Erros React de hidratacao podem ser causados por artefato de build/runtime, nao apenas por componentes React.
- Antes de investigar componentes, validar o HTML bruto e `document.doctype`.
- Se o HTML ja sai invalido de dentro do container, Traefik nao e a causa.
- Deploy bem-sucedido nao garante que o artefato ativo contem o fix; sempre confirmar `docker inspect`.

## Checklist para Futuros Incidentes

Quando houver tela branca, `React #418`, `React #423`, `HierarchyRequestError` ou `document.doctype = null`:

1. Capturar HTML bruto da rota afetada.
2. Confirmar se o HTML inicia com `<!DOCTYPE html>`.
3. No browser, avaliar `document.doctype`.
4. Coletar console via Chrome/CDP ou DevTools.
5. Identificar container ativo.
6. Identificar imagem ativa e tag/SHA.
7. Executar `docker inspect` no container.
8. Validar `WorkingDir`, healthcheck e labels.
9. Validar HTML dentro do container, antes do proxy.
10. Validar router/service do Traefik.
11. Confirmar workflow, commit e horario do deploy.
12. Somente depois investigar componentes React.

## Referencias Internas

- Commit: `83cf2fd`.
- Arquivo corrigido: `Dockerfile`.
- Documentos relacionados:
  - `docs/ai-context/CHANGELOG_AI.md`
  - `docs/ai-context/DECISIONS.md`
  - `docs/ai-context/TODO_AI.md`
