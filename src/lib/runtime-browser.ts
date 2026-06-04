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
    args: ["--registry", "https://registry.npmjs.org", "chrome-devtools-mcp@1.1.1"],
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
    } catch {
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

export async function navigatePage(client: Client, url: string) {
  await callTool(client, "navigate_page", {
    type: "url",
    url,
  });
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
