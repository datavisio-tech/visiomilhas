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

export async function runProgramsOperationalJourney(ctx: RuntimeContext) {
  const { client, baseUrl } = ctx;
  const notes: string[] = [];
  const newFeatures: Array<{ route: string; feature: string; status: string }> =
    [];

  await navigatePage(client, `${baseUrl}/app/accounts`);
  await waitForPageState(client, ["Lista de contas", "Nova conta"], 30_000);

  const firstAccountName = await evaluatePage(
    client,
    `(() => {
    const links = Array.from(document.querySelectorAll('tbody tr a[href*="/app/programs?accountId="]'));
    const names = links.map((link) => String(link.textContent || '').trim()).filter(Boolean);
    return names[1] || names[0] || null;
  })()`,
  );

  const programsHref = await evaluatePage(
    client,
    `(() => {
    const links = Array.from(document.querySelectorAll('tbody tr a[href*="/app/programs?accountId="]'));
    return links[1]?.getAttribute('href') || links[0]?.getAttribute('href') || null;
  })()`,
  );

  if (typeof firstAccountName !== "string" || !firstAccountName) {
    throw new Error("Could not determine the first account name from Accounts");
  }

  if (typeof programsHref !== "string" || !programsHref) {
    throw new Error("Could not determine the Programs link from Accounts");
  }

  await navigatePage(client, `${baseUrl}${programsHref}`);
  const programsState = await waitForPageState(
    client,
    ["Programas", firstAccountName, "Conta ativa"],
    30_000,
  );

  if (!programsState.pathname.includes("/app/programs")) {
    throw new Error("Programs was not opened from Accounts");
  }

  const searchParamsState = await getPageState(client);
  if (!searchParamsState?.href.includes("accountId=")) {
    throw new Error("Programs page did not persist accountId in the URL");
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

    const switchedState = await getPageState(client);
    if (!switchedState?.href.includes(`accountId=${alternateOption.value}`)) {
      throw new Error("Account switch did not update the URL");
    }

    if (switchedState.bodyText === programsState.bodyText) {
      throw new Error(
        "Programs content did not change after switching accounts",
      );
    }
  }

  await reloadPage(client);
  const refreshedState = await waitForPageState(
    client,
    ["Programas", "Conta ativa", "Saldo Atual"],
    30_000,
  );

  const refreshedUrlState = await getPageState(client);
  if (!refreshedUrlState?.href.includes("accountId=")) {
    throw new Error(
      "Programs account selection was not preserved after refresh",
    );
  }

  notes.push(`url:${refreshedUrlState.href}`);
  notes.push(`body:${refreshedState.bodyText.length}`);

  await clickText(client, "Contas");
  await waitForPageState(client, ["Lista de contas", "Nova conta"], 30_000);

  const accountControls = (await scanVisibleControls(client, "main")) || [];
  notes.push(`accounts_controls:${accountControls.length}`);

  return { notes, newFeatures };
}
