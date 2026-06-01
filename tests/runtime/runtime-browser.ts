import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export type JourneyUser = {
  email: string;
  password: string;
  name: string;
};

export type PageState = {
  href: string;
  pathname: string;
  title: string;
  bodyText: string;
};

export type RuntimeContext = {
  client: Client;
  baseUrl: string;
  user: JourneyUser;
  browserContextId: string;
  toolNames: Set<string>;
};

type ToolCallResult = {
  content?: Array<{ type?: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
};

const runtimeRoot = path.resolve(
  fileURLToPath(new URL("../..", import.meta.url)),
);

export function normalizeUserPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "emailteste01";
  }

  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function buildUser(prefix: string): JourneyUser {
  const suffix = prefix.replace(/^emailteste/i, "") || prefix;
  return {
    email: `${prefix}@teste.com`,
    password: prefix,
    name: `Usuário Teste ${suffix}`,
  };
}

export function extractText(result: ToolCallResult): string {
  return (result.content ?? [])
    .map((part) =>
      typeof part.text === "string" ? part.text : JSON.stringify(part),
    )
    .join("\n")
    .trim();
}

export function stateText(state: PageState | null): string {
  if (!state) {
    return "";
  }

  return [state.href, state.pathname, state.title, state.bodyText].join("\n");
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function canReach(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok || response.status === 302 || response.status === 307;
  } catch {
    return false;
  }
}

export async function ensureDevServer(url: string) {
  if (await canReach(url)) {
    return null;
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const resolvedOrigin = new URL(url).origin;
  const devServer = spawn(npmCommand, ["run", "dev"], {
    cwd: runtimeRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      PORT: new URL(url).port || "3001",
      BETTER_AUTH_URL: resolvedOrigin,
      APP_URL: resolvedOrigin,
      NEXT_PUBLIC_APP_URL: resolvedOrigin,
      VISIOMILHEIRO_FAKE_AUTH_FALLBACK: "0",
    },
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 120_000) {
    if (await canReach(url)) {
      return devServer;
    }
    await sleep(1000);
  }

  devServer.kill();
  throw new Error(`Development server did not become reachable at ${url}`);
}

export async function connectChromeDevToolsMcp() {
  const client = new Client({
    name: "visiomilhas-runtime-test",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: [
      "--registry",
      "https://registry.npmjs.org",
      "chrome-devtools-mcp@1.1.1",
    ],
  });

  await client.connect(transport);
  return client;
}

export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  const result = (await client.callTool({
    name,
    arguments: args,
  })) as ToolCallResult;

  if (result.isError) {
    throw new Error(extractText(result) || `Tool ${name} returned an error`);
  }

  return result;
}

export async function listToolNames(client: Client): Promise<Set<string>> {
  const result = (await client.listTools({})) as {
    tools?: Array<{ name: string }>;
  };

  return new Set((result.tools ?? []).map((tool) => tool.name));
}

export function parseLatestPageId(text: string): number | null {
  const matches = [...text.matchAll(/^(\d+):/gm)].map((match) =>
    Number(match[1]),
  );
  return matches.length ? Math.max(...matches) : null;
}

export function parsePageIds(text: string): number[] {
  const ids = [...text.matchAll(/^(\d+):/gm)].map((match) => Number(match[1]));
  return [...new Set(ids)].sort((left, right) => left - right);
}

export async function evaluatePage(client: Client, script: string) {
  const result = await callTool(client, "evaluate_script", {
    function: `() => { return (${script}); }`,
  });

  const text = extractText(result);
  if (!text) {
    return null;
  }

  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const payload = fencedJson?.[1] ?? text;

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return text;
  }
}

export async function getPageState(client: Client): Promise<PageState | null> {
  return (await evaluatePage(
    client,
    `(() => ({
      href: window.location.href,
      pathname: window.location.pathname,
      title: document.title || '',
      bodyText: document.body ? document.body.innerText : '',
    }))()`,
  )) as PageState | null;
}

export async function waitForPageState(
  client: Client,
  expectedTexts: string[],
  timeoutMs = 30_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const state = await getPageState(client);
      if (
        state &&
        expectedTexts.some((text) => stateText(state).includes(text))
      ) {
        return state;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("Execution context was destroyed") ||
        message.includes("context was destroyed")
      ) {
        await sleep(300);
        continue;
      }

      throw error;
    }

    await sleep(300);
  }

  throw new Error(`Timeout waiting for any of: ${expectedTexts.join(", ")}`);
}

export async function waitForNetworkText(
  client: Client,
  predicate: RegExp,
  timeoutMs = 45_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const text = extractText(
      await callTool(client, "list_network_requests", {}),
    );
    if (predicate.test(text)) {
      return text;
    }

    await sleep(750);
  }

  throw new Error(`Timeout waiting for network text: ${predicate}`);
}

export async function waitForSelectOptions(
  client: Client,
  labelText: string,
  expectedOptionText: string,
  timeoutMs = 30_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const found = await evaluatePage(
        client,
        `(() => {
        const wanted = ${JSON.stringify(labelText)}.toLowerCase();
        const expected = ${JSON.stringify(expectedOptionText)}.toLowerCase();
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find((l) => (l.innerText||l.textContent||'').toLowerCase().includes(wanted));
        let select = null;
        if (label) {
          select = label.parentElement?.querySelector('select') || document.querySelector('select[name="account_id"]');
        }
        if (!select) {
          select = document.querySelector('select[name="account_id"]') || document.querySelector('select');
        }
        if (!select) return false;
        const options = Array.from(select.querySelectorAll('option')).map(o => (o.innerText||o.textContent||'').trim()).filter(Boolean);
        return options.some(o => o.toLowerCase().includes(expected));
      })()`,
      );

      if (found) return true;
    } catch (err) {
      // ignore and retry
    }

    await sleep(300);
  }

  return false;
}

export async function openIsolatedPage(
  client: Client,
  url: string,
  contextId: string,
) {
  await callTool(client, "new_page", {
    url,
    isolatedContext: contextId,
  });

  const pages = extractText(await callTool(client, "list_pages", {}));
  const latestPageId = parseLatestPageId(pages);
  if (latestPageId !== null) {
    await callTool(client, "select_page", {
      pageId: latestPageId,
      bringToFront: true,
    });
  }
}

export async function selectPage(client: Client, pageId: number) {
  await callTool(client, "select_page", {
    pageId,
    bringToFront: true,
  });
}

export async function navigatePage(client: Client, url: string) {
  await callTool(client, "navigate_page", {
    type: "url",
    url,
  });
}

export async function reloadPage(client: Client) {
  await callTool(client, "navigate_page", {
    type: "reload",
    ignoreCache: true,
  });
}

export async function clickText(client: Client, text: string) {
  await evaluatePage(
    client,
    `(() => {
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim();
      const wanted = normalize(${JSON.stringify(text)}).toLowerCase();
      const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], [role="menuitem"], [role="option"]'));
      const exactMatches = candidates.filter((node) => normalize(node.innerText || node.textContent).toLowerCase() === wanted);
      const partialMatches = candidates.filter((node) => normalize(node.innerText || node.textContent).toLowerCase().includes(wanted));
      const node = (exactMatches.length ? exactMatches[exactMatches.length - 1] : null) || (partialMatches.length ? partialMatches[partialMatches.length - 1] : null);
      if (!node) {
        throw new Error('Elemento clicável não encontrado: ' + ${JSON.stringify(text)});
      }
      node.click();
      return true;
    })()`,
  );
}

export async function clickRowAction(
  client: Client,
  rowText: string,
  actionLabel: string,
) {
  await evaluatePage(
    client,
    `(() => {
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim().toLowerCase();
      const wantedRow = normalize(${JSON.stringify(rowText)});
      const rows = Array.from(document.querySelectorAll('tr'));
      const row = rows.find((candidate) => normalize(candidate.innerText || candidate.textContent).includes(wantedRow));
      if (!row) {
        throw new Error('Linha da conta não encontrada: ' + ${JSON.stringify(rowText)});
      }
      const button = row.querySelector('button[aria-label="Ações da conta"]');
      if (!button) {
        throw new Error('Menu de ações não encontrado para: ' + ${JSON.stringify(rowText)});
      }
      button.click();
      return true;
    })()`,
  );
  await clickText(client, actionLabel);
}

export async function fillField(
  client: Client,
  label: string,
  value: string | boolean,
) {
  await evaluatePage(
    client,
    `(() => {
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim();
      const wanted = normalize(${JSON.stringify(label)}).toLowerCase();
      const labels = Array.from(document.querySelectorAll('label'));
      const labelNode = labels.find((node) => normalize(node.innerText || node.textContent).toLowerCase().includes(wanted));

      let control = null;
      if (labelNode?.htmlFor) {
        control = document.getElementById(labelNode.htmlFor);
      }
      if (!control && labelNode) {
        control = labelNode.querySelector('input, textarea, select') || labelNode.parentElement?.querySelector('input, textarea, select');
      }
      if (!control) {
        control = Array.from(document.querySelectorAll('input, textarea, select')).find((node) => {
          const attr = normalize(node.getAttribute('name') || node.getAttribute('placeholder') || node.getAttribute('aria-label'));
          return attr.toLowerCase().includes(wanted);
        }) || null;
      }

      if (!control) {
        // heurísticas adicionais: placeholder, aria-label, input[type=search]
        const candidates = Array.from(document.querySelectorAll('input, textarea, select'));
        const fallback = candidates.find((node) => {
          const placeholder = (node.getAttribute('placeholder') || '').toLowerCase();
          const aria = (node.getAttribute('aria-label') || '').toLowerCase();
          const name = (node.getAttribute('name') || '').toLowerCase();
          return placeholder.includes(wanted) || aria.includes(wanted) || name.includes(wanted);
        });
        if (fallback) {
          control = fallback;
        } else {
          const searchInput = document.querySelector('input[type="search"]');
          if (searchInput) {
            control = searchInput;
          }
        }
      }

      if (!control) {
        // fallback: try visible numeric inputs in modal (saldo/cpm)
        const dialog = document.querySelector('[role="dialog"]') || document.body;
        const numeric = Array.from(dialog.querySelectorAll('input[type="number"]')).filter(i => {
          const rect = i.getBoundingClientRect();
          const style = window.getComputedStyle(i);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        });
        if (numeric.length) {
          // choose by label hint
          if (wanted.includes('saldo')) {
            control = numeric[0];
          } else if (wanted.includes('cpm')) {
            control = numeric.length > 1 ? numeric[1] : numeric[0];
          } else {
            control = numeric[0];
          }
        }
      }

      if (!control) {
        throw new Error('Campo não encontrado: ' + ${JSON.stringify(label)});
      }

      if (control.type === 'checkbox') {
        const shouldBeChecked = Boolean(${JSON.stringify(value)});
        if (control.checked !== shouldBeChecked) {
          control.click();
        }
        return true;
      }

      const descriptor = Object.getOwnPropertyDescriptor(control.constructor.prototype, 'value');
      descriptor?.set?.call(control, ${JSON.stringify(value)});
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
}

export async function submitJsonPost(
  client: Client,
  url: string,
  payload: Record<string, unknown>,
) {
  return (await evaluatePage(
    client,
    `(() => fetch(${JSON.stringify(url)}, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(${JSON.stringify(payload)}),
    }).then(async (response) => ({
      ok: response.ok,
      status: response.status,
      body: await response.json().catch(() => null),
    })))()`,
  )) as { ok?: boolean; status?: number; body?: any } | null;
}

export async function ensureOnAppOrigin(client: Client, baseUrl: string) {
  const state = await getPageState(client).catch(() => null);
  if (state?.href.startsWith(baseUrl)) {
    return;
  }

  await navigatePage(client, `${baseUrl}/sign-in`);
  await waitForPageState(
    client,
    ["Entrar com e-mail", "Criar conta"],
    30_000,
  ).catch(() => undefined);
}

export async function signOutCurrentPage(client: Client) {
  try {
    await clickText(client, "Sair");
    return;
  } catch {
    const signOutResult = await submitJsonPost(
      client,
      "/api/auth/sign-out",
      {},
    );

    if (!signOutResult?.ok || signOutResult.body?.success !== true) {
      throw new Error(
        `Sign-out request failed: ${JSON.stringify(signOutResult)}`,
      );
    }
  }
}

export async function scanVisibleControls(
  client: Client,
  scopeSelector = "main",
) {
  return (await evaluatePage(
    client,
    `(() => {
      const scope = document.querySelector(${JSON.stringify(scopeSelector)}) || document.body;
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim();
      const isVisible = (node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const controls = Array.from(scope.querySelectorAll('button, a, [role="button"], [role="menuitem"], [role="option"], th'))
        .filter(isVisible)
        .map((node) => normalize(node.innerText || node.textContent))
        .filter(Boolean);
      return [...new Set(controls)];
    })()`,
  )) as string[] | null;
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
