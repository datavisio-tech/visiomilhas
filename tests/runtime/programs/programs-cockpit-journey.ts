import {
  clickText,
  evaluatePage,
  fillField,
  getPageState,
  navigatePage,
  reloadPage,
  scanVisibleControls,
  waitForPageState,
  type RuntimeContext,
} from "../runtime-browser";

type SelectState = {
  value: string;
  options: Array<{ value: string; label: string }>;
} | null;

export async function runProgramsCockpitJourney(ctx: RuntimeContext) {
  const { client, baseUrl } = ctx;
  const notes: string[] = [];

  await navigatePage(client, `${baseUrl}/sign-in`);
  await waitForPageState(
    client,
    ["Entrar com e-mail", "Controle suas milhas"],
    30_000,
  );
  notes.push("login_page:ok");

  await navigatePage(client, `${baseUrl}/app/accounts`);
  await waitForPageState(client, ["Lista de contas", "Nova conta"], 30_000);
  notes.push("accounts_page:ok");

  const programsHref = await evaluatePage(
    client,
    `(() => {
      const links = Array.from(document.querySelectorAll('tbody tr a[href*="/app/programs?accountId="]'));
      return links[0]?.getAttribute('href') || null;
    })()`,
  );

  if (typeof programsHref !== "string" || !programsHref) {
    throw new Error("Could not determine the Programs link from Accounts");
  }

  await navigatePage(client, `${baseUrl}${programsHref}`);
  await waitForPageState(
    client,
    ["Cockpit da conta", "Resumo", "Extrato"],
    30_000,
  );
  notes.push("programs_header:ok");

  const cockpitState = await getPageState(client);
  if (!cockpitState?.href.includes("accountId=")) {
    throw new Error("Programs cockpit did not persist accountId in the URL");
  }

  const selectorState = (await evaluatePage(
    client,
    `(() => {
      const select = document.querySelector('select[aria-label="Conta ativa"]');
      if (!select) return null;
      return {
        value: select.value,
        options: Array.from(select.options).map((option) => ({
          value: option.value,
          label: String(option.textContent || '').trim(),
        })),
      };
    })()`,
  )) as SelectState;

  if (!selectorState?.options?.length) {
    throw new Error("Account selector was not rendered on Programs");
  }

  const alternateOption = selectorState.options.find(
    (option) => option.value !== selectorState.value,
  );

  if (alternateOption) {
    await fillField(client, "Conta ativa", alternateOption.value);
    await waitForPageState(
      client,
      [alternateOption.label, `accountId=${alternateOption.value}`],
      30_000,
    );
    notes.push("account_switch:ok");
  }

  await clickText(client, "Extrato");
  await waitForPageState(
    client,
    ["Extrato", "Descrição", "Saldo após"],
    30_000,
  );
  notes.push("statement_tab:ok");

  await clickText(client, "Gráficos");
  await waitForPageState(
    client,
    ["30 dias", "Evolução temporal da conta"],
    30_000,
  );
  notes.push("charts_tab:ok");

  await clickText(client, "Pendências");
  await waitForPageState(
    client,
    ["Compras pendentes", "Transferências em aberto"],
    30_000,
  );
  notes.push("pending_tab:ok");

  await clickText(client, "Assinaturas");
  await waitForPageState(
    client,
    ["Assinaturas ativas", "Gestão da assinatura"],
    30_000,
  );
  notes.push("subscriptions_tab:ok");

  await reloadPage(client);
  await waitForPageState(
    client,
    ["Assinaturas ativas", "Gestão da assinatura"],
    30_000,
  );
  const refreshedState = await getPageState(client);
  if (!refreshedState?.href.includes("accountId=")) {
    throw new Error("Programs cockpit state was not preserved after refresh");
  }
  notes.push("refresh_persisted:ok");

  await navigatePage(client, `${baseUrl}/sign-in?callbackUrl=/app/programs`);
  await waitForPageState(client, ["Entrar com e-mail"], 30_000);
  notes.push("signin_roundtrip:ok");

  const controls = (await scanVisibleControls(client, "main")) || [];
  notes.push(`visible_controls:${controls.length}`);

  return { notes, newFeatures: [] };
}
