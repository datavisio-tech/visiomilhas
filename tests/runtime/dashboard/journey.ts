import {
  clickText,
  navigatePage,
  openIsolatedPage,
  reloadPage,
  waitForPageState,
  type RuntimeContext,
} from "../runtime-browser";

function hasCriticalJsError(bodyText: string) {
  return /TypeError|ReferenceError|Hydration failed|Application error/i.test(
    bodyText,
  );
}

export async function runDashboardJourney(ctx: RuntimeContext) {
  const { client, baseUrl, browserContextId } = ctx;

  await navigatePage(client, `${baseUrl}/app/dashboard`);
  const phase1 = await waitForPageState(
    client,
    ["Central operacional", "Saldo consolidado", "Visão geral"],
    30_000,
  );

  if (hasCriticalJsError(phase1.bodyText)) {
    throw new Error("Dashboard loaded with a critical JavaScript error");
  }

  await waitForPageState(
    client,
    ["Saldo consolidado", "Resultado operacional", "CPM médio", "Margem média"],
    30_000,
  );

  await waitForPageState(client, ["Visão geral", "Contas"], 30_000);

  await clickText(client, "Contas");
  const accountsState = await waitForPageState(
    client,
    ["Contas", "Nova conta", "Buscar contas"],
    30_000,
  );

  if (hasCriticalJsError(accountsState.bodyText)) {
    throw new Error("Accounts page loaded with a critical JavaScript error");
  }

  await clickText(client, "Visão geral");
  await waitForPageState(
    client,
    ["Central operacional", "Saldo consolidado", "Visão geral"],
    30_000,
  );

  await reloadPage(client);
  const refreshed = await waitForPageState(
    client,
    ["Saldo consolidado", "Resultado operacional", "CPM médio", "Margem média"],
    30_000,
  );

  if (hasCriticalJsError(refreshed.bodyText)) {
    throw new Error("Dashboard lost state after refresh");
  }

  await openIsolatedPage(client, `${baseUrl}/app/dashboard`, browserContextId);
  await waitForPageState(
    client,
    ["Saldo consolidado", "Resultado operacional", "CPM médio", "Margem média"],
    30_000,
  );

  return { notes: [] as string[] };
}
