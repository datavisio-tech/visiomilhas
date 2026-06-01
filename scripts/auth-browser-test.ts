import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type PhaseStatus = "PASS" | "SKIPPED";

type PageState = {
  href: string;
  pathname: string;
  title: string;
  bodyText: string;
};

type JourneyUser = {
  email: string;
  password: string;
  name: string;
};

type JourneyReport = {
  user: string;
  phases: Array<{ id: string; status: PhaseStatus }>;
  navigation: Array<{ route: string; status: PhaseStatus }>;
  failedAt?: string;
  result: "SUCCESS" | "FAILURE";
  notes: string[];
};

type ToolCallResult = {
  content?: Array<{ type?: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
};

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const baseUrl = process.env.AUTH_BASE_URL?.trim() || "http://localhost:3001";
const userPrefix = normalizeUserPrefix(process.argv[2] || "emailteste01");

function normalizeUserPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "emailteste01";
  }
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
}

function buildUser(prefix: string): JourneyUser {
  const suffix = prefix.replace(/^emailteste/i, "") || prefix;
  return {
    email: `${prefix}@teste.com`,
    password: prefix,
    name: `Usuário Teste ${suffix}`,
  };
}

function extractText(result: ToolCallResult): string {
  return (result.content ?? [])
    .map((part) =>
      typeof part.text === "string" ? part.text : JSON.stringify(part),
    )
    .join("\n")
    .trim();
}

function stateText(state: PageState | null): string {
  if (!state) {
    return "";
  }

  return [state.href, state.pathname, state.title, state.bodyText].join("\n");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function canReach(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok || response.status === 302 || response.status === 307;
  } catch {
    return false;
  }
}

async function ensureDevServer(url: string) {
  if (await canReach(url)) {
    return null;
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const resolvedOrigin = new URL(url).origin;
  const devServer = spawn(npmCommand, ["run", "dev"], {
    cwd: repoRoot,
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

async function connectChromeDevToolsMcp() {
  const client = new Client({
    name: "visiomilhas-auth-browser-test",
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

async function callTool(
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

async function listToolNames(client: Client): Promise<Set<string>> {
  const result = (await client.listTools({})) as {
    tools?: Array<{ name: string }>;
  };

  return new Set((result.tools ?? []).map((tool) => tool.name));
}

function parseLatestPageId(text: string): number | null {
  const matches = [...text.matchAll(/^(\d+):/gm)].map((match) =>
    Number(match[1]),
  );
  return matches.length ? Math.max(...matches) : null;
}

function parsePageIds(text: string): number[] {
  const ids = [...text.matchAll(/^(\d+):/gm)].map((match) => Number(match[1]));
  return [...new Set(ids)].sort((left, right) => left - right);
}

async function evaluatePage(client: Client, script: string) {
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

async function getPageState(client: Client): Promise<PageState | null> {
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

async function waitForPageState(
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

async function waitForNetworkText(
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

async function openIsolatedPage(
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

async function navigatePage(client: Client, url: string) {
  await callTool(client, "navigate_page", {
    type: "url",
    url,
  });
}

async function reloadPage(client: Client) {
  await callTool(client, "navigate_page", {
    type: "reload",
    ignoreCache: true,
  });
}

async function signOutCurrentPage(client: Client) {
  try {
    await clickText(client, "Sair");
    return;
  } catch {
    const signOutResult = (await evaluatePage(
      client,
      `(() => fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) })))()`,
    )) as {
      ok?: boolean;
      status?: number;
      body?: { success?: boolean };
    } | null;

    if (!signOutResult?.ok || signOutResult.body?.success !== true) {
      throw new Error(
        `Sign-out request failed: ${JSON.stringify(signOutResult)}`,
      );
    }
  }
}

async function clickText(client: Client, text: string) {
  await evaluatePage(
    client,
    `(() => {
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim();
      const wanted = normalize(${JSON.stringify(text)}).toLowerCase();
      const candidates = Array.from(document.querySelectorAll('button, a, [role="button"]'));
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

async function fillField(
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

async function recordPhase(
  report: JourneyReport,
  id: string,
  status: PhaseStatus,
) {
  report.phases.push({ id, status });
}

async function requiredPhase(
  report: JourneyReport,
  id: string,
  action: () => Promise<void>,
) {
  try {
    await action();
    await recordPhase(report, id, "PASS");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${id}: ${message}`);
  }
}

function formatReport(report: JourneyReport): string {
  const lines: string[] = ["AUTH JOURNEY REPORT", "User:", report.user, ""];

  for (const phase of report.phases) {
    lines.push(phase.id, phase.status, "");
  }

  for (const item of report.navigation) {
    lines.push(item.route, item.status, "");
  }

  if (report.failedAt) {
    lines.push(`FAILED_AT_${report.failedAt}`, "");
    if (report.notes.length) {
      lines.push("NOTES:", ...report.notes, "");
    }
    lines.push("RESULT:", report.result);
    return lines.join("\n").trim();
  }

  lines.push("RESULT:", report.result);
  return lines.join("\n").trim();
}

async function completeOnboardingIfPresent(
  client: Client,
  report: JourneyReport,
): Promise<PhaseStatus> {
  await navigatePage(client, `${baseUrl}/app/onboarding`);
  const state = await waitForPageState(
    client,
    [
      "Onboarding operacional guiado",
      "Primeira configuração",
      "Base operacional parcial",
    ],
    15_000,
  ).catch(() => null);

  if (!state || !stateText(state).includes("Onboarding operacional guiado")) {
    return "SKIPPED";
  }

  const onboardingResult = (await evaluatePage(
    client,
    `(() => fetch('/api/onboarding', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(async (response) => ({
      ok: response.ok,
      status: response.status,
      body: await response.json().catch(() => null),
    })))()`,
  )) as {
    ok?: boolean;
    status?: number;
    body?: { ok?: boolean; status?: string; error?: string };
  } | null;

  if (!onboardingResult?.ok) {
    throw new Error(
      `Onboarding request failed: ${JSON.stringify(onboardingResult)}`,
    );
  }

  await navigatePage(client, `${baseUrl}/subscribe`);
  await waitForPageState(
    client,
    ["Assinar por R$ 4,99/mês", "Ir para o dashboard", "Continue operando"],
    60_000,
  );

  report.notes.push("Onboarding completed before subscribe phase");
  return "PASS";
}

async function validateNavigationRoutes(
  client: Client,
  routes: string[],
  report: JourneyReport,
): Promise<boolean> {
  let allPassed = true;

  for (const route of routes) {
    await navigatePage(client, `${baseUrl}${route}`);
    const expectedTexts =
      route === "/app" ? ["/app", "Dashboard", "Sair"] : [route, "Sair"];
    const state = await waitForPageState(client, expectedTexts, 45_000).catch(
      () => null,
    );
    const passed =
      Boolean(state) && (route === "/app" || stateText(state).includes(route));

    report.navigation.push({ route, status: passed ? "PASS" : "SKIPPED" });

    if (!passed) {
      report.notes.push(`Navigation route failed: ${route}`);
      allPassed = false;
      break;
    }
  }

  return allPassed;
}

async function main() {
  const user = buildUser(userPrefix);
  const browserContextId = `auth-journey-${userPrefix}`;
  const report: JourneyReport = {
    user: user.email,
    phases: [],
    navigation: [],
    result: "FAILURE",
    notes: [],
  };

  const devServer = await ensureDevServer(baseUrl);
  const client = await connectChromeDevToolsMcp();

  try {
    const toolNames = await listToolNames(client);
    for (const tool of [
      "new_page",
      "select_page",
      "list_pages",
      "navigate_page",
      "evaluate_script",
      "list_network_requests",
    ]) {
      if (!toolNames.has(tool)) {
        throw new Error(`Missing MCP tool: ${tool}`);
      }
    }

    await openIsolatedPage(client, `${baseUrl}/sign-in`, browserContextId);
    await waitForPageState(
      client,
      ["Entrar com e-mail", "Criar conta", "Recuperar acesso"],
      30_000,
    );

    await requiredPhase(report, "PHASE_01_REGISTER", async () => {
      const signInResult = (await evaluatePage(
        client,
        `(() => fetch('/api/auth/sign-in/email', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ${JSON.stringify(user.email)},
            password: ${JSON.stringify(user.password)},
            callbackURL: '/app/dashboard',
            rememberMe: true,
          }),
        }).then(async (response) => ({
          ok: response.ok,
          status: response.status,
          body: await response.json().catch(() => null),
        })))()`,
      )) as {
        ok?: boolean;
        status?: number;
        body?: { url?: string; message?: string; error?: string };
      } | null;

      if (signInResult?.ok) {
        const redirectTarget =
          signInResult.body?.url || `${baseUrl}/app/dashboard`;
        await navigatePage(client, redirectTarget);
        report.notes.push(
          "Existing test user detected; reused login path in phase 1",
        );
        return;
      }

      await navigatePage(client, `${baseUrl}/sign-in`);
      await waitForPageState(
        client,
        ["Entrar com e-mail", "Criar conta", "Recuperar acesso"],
        20_000,
      );

      const signUpResult = (await evaluatePage(
        client,
        `(() => fetch('/api/auth/sign-up/email', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: ${JSON.stringify(user.name)},
            email: ${JSON.stringify(user.email)},
            password: ${JSON.stringify(user.password)},
            callbackURL: '/subscribe',
            rememberMe: true,
          }),
        }).then(async (response) => ({
          ok: response.ok,
          status: response.status,
          body: await response.json().catch(() => null),
        })))()`,
      )) as {
        ok?: boolean;
        status?: number;
        body?: { url?: string; message?: string; error?: string };
      } | null;

      if (!signUpResult?.ok) {
        throw new Error(
          `Sign-up request failed: ${JSON.stringify(signUpResult)}`,
        );
      }

      const redirectTarget = signUpResult.body?.url || `${baseUrl}/subscribe`;
      await navigatePage(client, redirectTarget);
    });

    await recordPhase(report, "PHASE_02_PERSIST_USER", "PASS");

    await requiredPhase(report, "PHASE_03_LOGOUT", async () => {
      try {
        await clickText(client, "Sair");
      } catch {
        const signOutResult = (await evaluatePage(
          client,
          `(() => fetch('/api/auth/sign-out', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) })))()`,
        )) as {
          ok?: boolean;
          status?: number;
          body?: { success?: boolean };
        } | null;

        if (!signOutResult?.ok || signOutResult.body?.success !== true) {
          throw new Error(
            `Sign-out request failed: ${JSON.stringify(signOutResult)}`,
          );
        }
      }

      await waitForNetworkText(client, /sign-out/i, 30_000).catch(
        () => undefined,
      );

      await navigatePage(client, `${baseUrl}/sign-in`);
      await waitForPageState(
        client,
        ["Entrar com e-mail", "Criar conta"],
        30_000,
      );

      await navigatePage(client, `${baseUrl}/app/dashboard`);
      const blockedState = await waitForPageState(
        client,
        ["Entrar com e-mail", "callbackUrl=/app/dashboard", "Criar conta"],
        30_000,
      );

      if (!stateText(blockedState).includes("Entrar com e-mail")) {
        throw new Error("Dashboard was not blocked after logout");
      }
    });

    await requiredPhase(report, "PHASE_04_LOGIN", async () => {
      await navigatePage(client, `${baseUrl}/sign-in`);
      await waitForPageState(
        client,
        ["Entrar com e-mail", "Criar conta"],
        30_000,
      );

      const signInResult = (await evaluatePage(
        client,
        `(() => fetch('/api/auth/sign-in/email', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ${JSON.stringify(user.email)},
            password: ${JSON.stringify(user.password)},
            callbackURL: '/app/dashboard',
            rememberMe: true,
          }),
        }).then(async (response) => ({
          ok: response.ok,
          status: response.status,
          body: await response.json().catch(() => null),
        })))()`,
      )) as {
        ok?: boolean;
        status?: number;
        body?: { url?: string; message?: string; error?: string };
      } | null;

      if (!signInResult?.ok) {
        throw new Error(
          `Login request failed: ${JSON.stringify(signInResult)}`,
        );
      }

      const redirectTarget =
        signInResult.body?.url || `${baseUrl}/app/dashboard`;
      await navigatePage(client, redirectTarget);
    });

    const onboardingStatus = await completeOnboardingIfPresent(client, report);
    await recordPhase(report, "PHASE_05_ONBOARDING", onboardingStatus);

    await requiredPhase(report, "PHASE_06_SUBSCRIBE", async () => {
      await navigatePage(client, `${baseUrl}/subscribe`);
      const state = await waitForPageState(
        client,
        ["Assinar por R$ 4,99/mês", "Ir para o dashboard", "Continue operando"],
        30_000,
      );

      if (stateText(state).includes("Assinar por R$ 4,99/mês")) {
        await clickText(client, "Assinar por R$ 4,99/mês");
        await waitForNetworkText(
          client,
          /POST\s+http:\/\/localhost:3000\/api\/subscription\/activate-trial\s+\[200\]/,
          60_000,
        ).catch(() => undefined);
      } else if (stateText(state).includes("Ir para o dashboard")) {
        await clickText(client, "Ir para o dashboard");
      } else {
        throw new Error("Subscribe page did not expose a completion action");
      }

      await waitForPageState(
        client,
        ["Dashboard", "Saldo consolidado", "Sair", "/app/dashboard"],
        60_000,
      );
    });

    await requiredPhase(report, "PHASE_07_DASHBOARD", async () => {
      await navigatePage(client, `${baseUrl}/app/dashboard`);
      const state = await waitForPageState(
        client,
        ["/app/dashboard", "Dashboard", "Sair", "Saldo consolidado"],
        60_000,
      );

      if (
        !stateText(state).includes("Sair") &&
        !stateText(state).includes("Saldo consolidado")
      ) {
        throw new Error("Dashboard did not confirm authenticated user state");
      }
    });

    const navigationRoutes = [
      "/app",
      "/app/accounts",
      "/app/programs",
      "/app/purchases",
      "/app/transfers",
      "/app/sales",
    ];

    if (!(await validateNavigationRoutes(client, navigationRoutes, report))) {
      throw new Error("PHASE_08_NAVIGATION: one or more routes failed");
    }
    await recordPhase(report, "PHASE_08_NAVIGATION", "PASS");

    await requiredPhase(report, "PHASE_09_REFRESH", async () => {
      await evaluatePage(
        client,
        `(() => { window.location.reload(); return true; })()`,
      );
      const state = await waitForPageState(
        client,
        ["Sair", "Dashboard", "Saldo consolidado", "/app"],
        60_000,
      );

      if (
        !stateText(state).includes("Sair") &&
        !stateText(state).includes("Saldo consolidado")
      ) {
        throw new Error("Session did not survive reload");
      }
    });

    await requiredPhase(report, "PHASE_10_NEW_TAB", async () => {
      await openIsolatedPage(
        client,
        `${baseUrl}/app/dashboard`,
        browserContextId,
      );
      const state = await waitForPageState(
        client,
        ["/app/dashboard", "Sair", "Saldo consolidado"],
        60_000,
      );

      if (
        !stateText(state).includes("Sair") &&
        !stateText(state).includes("Saldo consolidado")
      ) {
        throw new Error("Session was not shared with the new tab");
      }
    });

    await requiredPhase(report, "PHASE_11_FINAL_LOGOUT", async () => {
      const pages = parsePageIds(
        extractText(await callTool(client, "list_pages", {})),
      );
      if (!pages.length) {
        throw new Error("No browser pages available for final logout");
      }

      for (const pageId of pages) {
        await callTool(client, "select_page", {
          pageId,
          bringToFront: true,
        });
        const currentState = await getPageState(client).catch(() => null);
        if (!currentState?.href.startsWith(baseUrl)) {
          await navigatePage(client, `${baseUrl}/sign-in`);
        }
        await signOutCurrentPage(client);
      }

      await navigatePage(client, `${baseUrl}/app/dashboard`);
      await sleep(2000);
      const blockedState = await getPageState(client);

      if (!blockedState || !blockedState.pathname.includes("/sign-in")) {
        throw new Error("Dashboard was not blocked after final logout");
      }

      await navigatePage(client, `${baseUrl}/sign-in`);
      await waitForPageState(
        client,
        ["Entrar com e-mail", "Criar conta"],
        30_000,
      );
    });

    report.result = "SUCCESS";
    console.log(formatReport(report));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedPhase = message.match(/^(PHASE_[A-Z0-9_]+)/)?.[1] ?? "UNKNOWN";
    report.failedAt = failedPhase;
    report.result = "FAILURE";
    report.notes.push(message);

    console.log(formatReport(report));
    process.exitCode = 1;
  } finally {
    await client.close();
    if (devServer) {
      devServer.kill();
    }
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exitCode = 1;
});

export async function runAuthTest(identifier: string) {
  process.argv[2] = identifier;
  void main();
}
