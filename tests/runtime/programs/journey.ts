import {
  RuntimeContext,
  getPageState,
  navigatePage,
  scanVisibleControls,
} from "../runtime-browser";

export async function runProgramsJourney(ctx: RuntimeContext) {
  const { client, baseUrl } = ctx;
  const notes: string[] = [];
  const newFeatures: Array<{ route: string; feature: string; status: string }> =
    [];

  await navigatePage(client, `${baseUrl}/app/programs`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    const state = await getPageState(client).catch(() => null);
    const bodyText = state?.bodyText ?? "";
    if (
      bodyText.includes("Saldo do programa") &&
      bodyText.includes("Contas cadastradas") &&
      bodyText.includes("Conta ativa")
    ) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const pageState = await getPageState(client);
  if (
    !pageState?.bodyText.includes("Saldo do programa") ||
    !pageState?.bodyText.includes("Contas cadastradas") ||
    !pageState?.bodyText.includes("Conta ativa")
  ) {
    throw new Error("Programs page did not render the operational summary");
  }

  const controls = (await scanVisibleControls(client, "main")) || [];
  notes.push(`visible_controls:${controls.length}`);
  notes.push(`controls:${controls.slice(0, 6).join(" | ")}`);

  return { notes, newFeatures };
}
