# MCP_SNIPPETS - Chrome DevTools MCP (exemplos)

Este arquivo reúne exemplos curtos para acelerar execuções manuais usando o Chrome DevTools MCP contra o runtime local.

Importante: adapte `http://localhost:3000` para o host/porta do seu ambiente.

1. Instalar / executar o servidor MCP (exemplo):

```bash
npx --registry https://registry.npmjs.org chrome-devtools-mcp@1.1.1
```

2. Exemplo: navegar até `/sign-in` e capturar screenshot (conceitual)

```json
{
  "steps": [
    { "action": "navigate", "url": "http://localhost:3000/sign-in" },
    { "action": "waitFor", "selector": "form[data-test=\"auth-card\"]" },
    { "action": "screenshot", "path": "./evidence/sign-in.png" }
  ]
}
```

3. Exemplo: coletar cookies e localStorage

```json
{
  "steps": [
    { "action": "getCookies" },
    { "action": "eval", "expression": "JSON.stringify(localStorage)" }
  ]
}
```

4. Exemplo: capturar rede (HAR) enquanto dispara um botão

```json
{
  "steps": [
    { "action": "startHAR", "path": "./evidence/signin.har" },
    {
      "action": "click",
      "selector": "button[data-test=\"submit-email-login\"]"
    },
    { "action": "waitForNavigation" },
    { "action": "stopHAR" }
  ]
}
```

Notas finais:

- Os exemplos são genéricos e dependem do cliente/formatos que você usa com o MCP. Use-os como referência e transforme-os em fixtures/commands do seu fluxo.
- Não automatize o fluxo OAuth completo; capture evidências e verifique redirecionamentos e requests relacionados.
