import {
  getAccountOperationalView,
  type AccountOperationalView,
} from "../../../../lib/data/programs";
import type { SessionContext } from "../../../../lib/server/auth-context";
import {
  parseProgramsCockpitPeriod,
  parseProgramsCockpitTab,
  type ProgramsCockpitTab,
} from "../domain/programs-cockpit";

export type ProgramsCockpitSearchParams = {
  accountId?: string | string[];
  tab?: string | string[];
  period?: string | string[];
};

export type ProgramsCockpitView = AccountOperationalView & {
  selectedTab: ProgramsCockpitTab;
  selectedPeriod: ReturnType<typeof parseProgramsCockpitPeriod>;
};

function parseAccountId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;
  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function resolveProgramsCockpitView(
  sessionContext: SessionContext | null | undefined,
  searchParams?: ProgramsCockpitSearchParams,
): Promise<ProgramsCockpitView> {
  const requestedAccountId = parseAccountId(searchParams?.accountId);
  const selectedTab = parseProgramsCockpitTab(searchParams?.tab);
  const selectedPeriod = parseProgramsCockpitPeriod(searchParams?.period);
  const view = await getAccountOperationalView(
    sessionContext,
    requestedAccountId,
  );

  return {
    ...view,
    selectedTab,
    selectedPeriod,
  };
}
