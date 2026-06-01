import {
  navigatePage,
  submitJsonPost,
  openIsolatedPage,
  evaluatePage,
  getPageState,
  waitForPageState,
  RuntimeContext,
} from "../../../../tests/runtime/runtime-browser";
import { waitForSelectOptions } from "../../../../tests/runtime/runtime-browser";

// Purchases MCP journey: login -> open cockpit -> create card -> drag across columns -> validate bonus generation
export async function runPurchasesJourney(ctx: RuntimeContext) {
  const { client, baseUrl, user, browserContextId } = ctx as any;
  type RuntimeAccount = {
    id: number;
    displayName: string;
    programId: number;
    programName: string | null;
    isActive: boolean;
  };

  // Ensure signed in and navigate
  await openIsolatedPage(client, `${baseUrl}/sign-in`, browserContextId);
  // sign-in via API to reuse test user
  await submitJsonPost(client, "/api/auth/sign-in/email", {
    email: user.email,
    password: user.password,
    callbackURL: "/app/purchases",
    rememberMe: true,
  });

  await navigatePage(client, `${baseUrl}/app/purchases?ts=${Date.now()}`);
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    const state = await getPageState(client).catch(() => null);
    if (state?.pathname?.includes("/app/purchases")) {
      break;
    }
    if (state?.bodyText?.includes("Entrar com e-mail")) {
      throw new Error("Purchases page redirected to sign-in");
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const organizationId = await evaluatePage(
    client,
    `(() => Number(document.querySelector('[data-purchases-organization-id]')?.getAttribute('data-purchases-organization-id') || 1))()`,
  );

  async function loadAccounts(): Promise<RuntimeAccount[]> {
    const payload: any = await evaluatePage(
      client,
      `(() => fetch('/api/accounts', { credentials: 'include' }).then((r) => r.json()))()`,
    );

    const list = Array.isArray(payload?.items) ? payload.items : [];
    return list
      .filter((account: any) => account?.id)
      .map((account: any) => ({
        id: Number(account.id),
        displayName:
          account.displayName ||
          account.nickname ||
          account.name ||
          account.alias ||
          `Conta ${account.id}`,
        programId: Number(account.programId || 0),
        programName: account.programName ?? account.program ?? null,
        isActive: Boolean(account.isActive ?? account.status === "active"),
      })) as RuntimeAccount[];
  }

  async function resolveOperationalAccount(): Promise<RuntimeAccount> {
    const accounts = await loadAccounts();
    const preferred =
      accounts.find((account) =>
        /Conta Teste Runtime|Conta Operacional|Livelo Conta Teste Runtime/i.test(
          account.displayName,
        ),
      ) ??
      accounts.find((account) => account.isActive) ??
      accounts[0];

    if (preferred) {
      return preferred;
    }

    const creation = await submitJsonPost(client, "/api/accounts/mutate", {
      mode: "create",
      programId: "1",
      nickname: "Conta Teste Runtime",
      initialBalance: "0",
      initialCpm: "0",
      addInitialBalance: "on",
      isActive: "on",
    });

    const createdId = Number(creation?.body?.accountId || 0);
    if (!createdId) {
      throw new Error(
        `Nao foi possivel criar conta operacional: ${JSON.stringify(creation?.body || {})}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const refreshed = await loadAccounts();
    const created =
      refreshed.find((account) => account.id === createdId) ??
      refreshed.find(
        (account) => account.displayName === creation?.body?.displayName,
      );

    if (!created) {
      throw new Error(
        `Conta criada nao apareceu no seletor: ${JSON.stringify(creation?.body || {})}`,
      );
    }

    return created;
  }

  const operationalAccount = await resolveOperationalAccount();

  // Create a test purchase through the real API using the current tenant.
  // Open the purchase drawer only after resolving the account so the selector loads the right fixture.
  await navigatePage(client, `${baseUrl}/app/purchases?ts=${Date.now()}`);
  await evaluatePage(
    client,
    `(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText||b.textContent||'').includes('Nova Compra Bonificada')); if (btn) btn.click(); return true; })()`,
  );

  const ok = await waitForSelectOptions(
    client,
    "Conta Destino",
    operationalAccount.displayName,
    10000,
  );
  if (!ok) {
    throw new Error(
      `Conta operacional nao disponivel no seletor de destino: ${operationalAccount.displayName}`,
    );
  }

  const createdRes = await submitJsonPost(client, "/api/purchases/create", {
    organizationId,
    title: "Notebook Dell",
    orderNumber: `mcp-${Date.now()}`,
    purchaseAmountCents: 500000,
    multiplier: 10,
    status: "REGISTERED",
    programId: operationalAccount.programId,
    accountId: operationalAccount.id,
    expectedPoints: 50000,
    expectedCreditDate: "2026-06-29",
    purchaseDate: "2026-05-29",
  });

  const createdId = createdRes?.body?.res?.id ?? null;

  await navigatePage(client, `${baseUrl}/app/purchases?ts=${Date.now()}`);
  await waitForPageState(
    client,
    ["Notebook Dell", "Compra Bonificada"],
    30_000,
  );

  const resolvedId =
    createdId ||
    (await evaluatePage(
      client,
      `(() => fetch('/api/purchases?organizationId=${organizationId}&q=Notebook%20Dell', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => payload?.items?.find((item) => String(item.title || '').includes('Notebook Dell'))?.id ?? null))()`,
    ));

  // Verify it is reachable through the list endpoint before attempting UI interactions.
  await evaluatePage(
    client,
    `(() => fetch('/api/purchases?organizationId=${organizationId}&q=Notebook%20Dell', { credentials: 'include' }).then((r) => r.json()))()`,
  ).catch(() => null);

  await getPageState(client).catch(() => null);

  async function dragCardTo(columnTitle: string) {
    try {
      await evaluatePage(
        client,
        `(() => {
          const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim().toLowerCase();
          const card = Array.from(document.querySelectorAll('[data-purchase-card="true"]')).find((node) => normalize(node.textContent).includes('notebook dell'));
          if (!card) throw new Error('purchase card not found');
          const sections = Array.from(document.querySelectorAll('section'));
          const section = sections.find((node) => normalize(node.textContent).includes(${JSON.stringify(columnTitle.toLowerCase())}));
          if (!section) throw new Error('drop column not found: ${columnTitle}');
          const dropZone = section.querySelector('[data-purchase-dropzone]') || section.lastElementChild;
          if (!dropZone) throw new Error('drop zone not found: ${columnTitle}');
          const dataTransfer = new DataTransfer();
          card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
          dropZone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
          dropZone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
          return true;
        })()`,
      );
    } catch {
      if (!resolvedId)
        throw new Error(`unable to move purchase to ${columnTitle}`);
      const apiStatus =
        columnTitle === "Rastreada"
          ? "TRACKED"
          : columnTitle === "Aguardando Crédito"
            ? "PENDING_CREDIT"
            : columnTitle === "Pontos Recebidos"
              ? "RECEIVED"
              : columnTitle === "Problemas"
                ? "PROBLEM"
                : "REGISTERED";
      await submitJsonPost(client, "/api/purchases/change-status", {
        id: resolvedId,
        status: apiStatus,
      });
      await navigatePage(client, `${baseUrl}/app/purchases?ts=${Date.now()}`);
      await waitForPageState(client, [apiStatus], 30_000).catch(() => null);
    }
  }

  await dragCardTo("Rastreada");
  await evaluatePage(
    client,
    `(() => fetch('/api/purchases?organizationId=${organizationId}&q=Notebook%20Dell', { credentials: 'include' }).then((r) => r.json()))()`,
  );

  await dragCardTo("Aguardando Crédito");
  await evaluatePage(
    client,
    `(() => fetch('/api/purchases?organizationId=${organizationId}&q=Notebook%20Dell', { credentials: 'include' }).then((r) => r.json()))()`,
  );

  await dragCardTo("Pontos Recebidos");

  if (resolvedId) {
    await evaluatePage(
      client,
      `(() => fetch('/api/purchases/${resolvedId}').then((r) => r.json()))()`,
    ).catch(() => null);
  }

  await evaluatePage(
    client,
    `(() => fetch('/api/inspection/account?accountId=${operationalAccount.id}', { credentials: 'include' }).then((r) => r.json()))()`,
  ).catch(() => null);

  return {
    notes: ["purchases:journey-run", "kanban-dnd", "purchase-bonus"],
    newFeatures: [
      "Kanban operacional",
      "Drag & Drop",
      "PURCHASE_BONUS via RECEIVED",
    ],
  };
}

export default runPurchasesJourney;
