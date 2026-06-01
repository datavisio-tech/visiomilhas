import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const baseUrl = process.env.AUTH_BASE_URL?.trim() || "http://localhost:3000";
const userPrefix = (process.argv[2] || "emailteste01").trim();

function buildUser(prefix: string) {
  const suffix = prefix.replace(/^emailteste/i, "") || prefix;
  return {
    email: `${prefix}@teste.com`,
    password: prefix,
    name: `Usuário Teste ${suffix}`,
  };
}

async function connect() {
  const client = new Client({ name: "mcp-inspect-dropdown", version: "1.0.0" });
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
  client: any,
  name: string,
  args: Record<string, unknown>,
) {
  const result = await client.callTool({ name, arguments: args });
  return result;
}

async function evaluatePage(client: any, script: string) {
  const result = await callTool(client, "evaluate_script", {
    function: `() => { return (${script}); }`,
  });
  const content = (result.content ?? [])
    .map((c: any) => (typeof c.text === "string" ? c.text : JSON.stringify(c)))
    .join("\n");
  // extract fenced JSON if present
  const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
  const payload = fenced ? fenced[1] : content;
  try {
    return JSON.parse(payload);
  } catch {
    return content;
  }
}

async function navigatePage(client: any, url: string) {
  await callTool(client, "navigate_page", { type: "url", url });
}

async function waitForPageState(
  client: any,
  expectedTexts: string[],
  timeoutMs = 30000,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const state = await evaluatePage(
      client,
      `(() => ({ href: window.location.href, pathname: window.location.pathname, title: document.title || '', bodyText: document.body ? document.body.innerText : '' }))()`,
    );
    const text = [state.href, state.pathname, state.title, state.bodyText].join(
      "\n",
    );
    if (expectedTexts.some((t) => text.includes(t))) return state;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timeout waiting for any of: ${expectedTexts.join(", ")}`);
}

async function main() {
  const user = buildUser(userPrefix);
  const client = await connect();
  try {
    // open sign-in and perform API sign-in
    await navigatePage(client, `${baseUrl}/sign-in`);
    // sign-in via API (fetch in page context to share cookies)
    const signIn = await evaluatePage(
      client,
      `(() => fetch('/api/auth/sign-in/email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(user.email)}, password: ${JSON.stringify(user.password)}, callbackURL: '/app/purchases', rememberMe: true }) }).then(r => r.json()).catch(e => ({ error: String(e) })))()`,
    );
    console.log("signIn:", signIn);

    // navigate to purchases
    await navigatePage(client, `${baseUrl}/app/purchases`);
    const pageState = await evaluatePage(
      client,
      `(() => ({ href: window.location.href, pathname: window.location.pathname, title: document.title || '', bodyText: document.body ? document.body.innerText : '' }))()`,
    );
    console.log(
      "pageState after navigate:",
      JSON.stringify(pageState, null, 2),
    );
    await waitForPageState(
      client,
      ["Nova Compra Bonificada", "Compras"],
      20000,
    );

    // click the Nova Compra Bonificada button and return button info
    const clickResult = await evaluatePage(
      client,
      `(() => {
      const normalize = (v) => String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
      const btns = Array.from(document.querySelectorAll('button'));
      const matches = btns.filter(b => normalize(b.innerText || b.textContent).includes('nova compra bonificada'));
      if(!matches.length) return { error: 'nova-button-not-found', count: 0 };
      const btn = matches[matches.length - 1];
      const info = { text: btn.innerText.slice(0,200), outer: btn.outerHTML.slice(0,500) };
      try {
        try { btn.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); } catch(e) {}
        try { btn.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); } catch(e) {}
        try { btn.click(); } catch(e) {}
      } catch(e) { return { error: 'click-failed', info, exception: String(e) } }
      return { ok: true, info };
    })()`,
    );
    console.log("clickResult:", JSON.stringify(clickResult, null, 2));

    // check if label exists immediately and after short delay
    const labelNow = await evaluatePage(
      client,
      `(() => !!Array.from(document.querySelectorAll('label')).some(l => String(l.innerText||l.textContent).toLowerCase().includes('loja parceira')))()`,
    );
    console.log("labelNow:", labelNow);
    await new Promise((r) => setTimeout(r, 500));
    const labelLater = await evaluatePage(
      client,
      `(() => !!Array.from(document.querySelectorAll('label')).some(l => String(l.innerText||l.textContent).toLowerCase().includes('loja parceira')))()`,
    );
    console.log("labelLater:", labelLater);
    // wait for modal label Loja Parceira
    await waitForPageState(client, ["Loja Parceira"], 10000);

    // open the partner picker (click the select button under label)
    const openRes = await evaluatePage(
      client,
      `(() => {
      const normalize = (v) => String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(l => normalize(l.innerText || l.textContent).includes('loja parceira'));
      if(!label) return { error: 'label-not-found' };
      const container = label.closest('div') || label.parentElement;
      const btn = container.querySelector('button');
      if(!btn) return { error: 'select-button-not-found' };
      btn.click();
      return { ok: true };
    })()`,
    );
    console.log("openRes:", openRes);

    // give DOM a moment to render dropdown
    await new Promise((r) => setTimeout(r, 500));

    // extract dropdown items
    const items = await evaluatePage(
      client,
      `(() => {
      try {
        const normalize = (v) => String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find(l => normalize(l.innerText || l.textContent).includes('loja parceira'));
        if(!label) return { error: 'label-not-found' };
        const container = label.closest('div') || label.parentElement;
        const dropdown = Array.from(container.querySelectorAll('div')).find(d => d.className && d.className.includes('absolute')) || null;
        if(!dropdown) return { error: 'dropdown-not-found' };
        const buttons = Array.from(dropdown.querySelectorAll('button'));
        return buttons.map(b => {
          const name = b.querySelector('.truncate.text-sm')?.innerText?.trim() || b.innerText.trim();
          const img = b.querySelector('img')?.getAttribute('src') || null;
          return { name, img };
        });
      } catch(e) { return { error: String(e) } }
    })()`,
    );

    console.log("dropdown items:", JSON.stringify(items, null, 2));
  } catch (err) {
    console.error("ERROR:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

void main();
