import { redirect } from "next/navigation";
import EmptyState from "../../../../components/ui/empty-state";
import { resolveControlledSessionContext } from "../../../../lib/server/controlled-session";
import { resolveProgramsCockpitView } from "../application/resolve-programs-cockpit";
import { ProgramsCockpitClient } from "./programs-cockpit.client";
import {
  parseProgramsCockpitPeriod,
  parseProgramsCockpitTab,
} from "../domain/programs-cockpit";

type Props = {
  searchParams?: {
    accountId?: string | string[];
    tab?: string | string[];
    period?: string | string[];
  };
};

function parseAccountId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;
  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function AccountEmptyState() {
  return (
    <EmptyState
      title="Nenhuma conta operacional encontrada"
      description="Crie uma conta em Accounts para abrir o cockpit operacional do programa."
      actionLabel="Ir para Contas"
      actionHref="/app/accounts"
    />
  );
}

export async function ProgramsCockpitPage({ searchParams }: Props) {
  const sessionContext = await resolveControlledSessionContext({
    source: "programs.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    // Consistent with Dashboard/Purchases: redirect unauthenticated users to sign-in
    redirect(`/sign-in?callbackUrl=/app/programs`);
  }

  const requestedAccountId = parseAccountId(searchParams?.accountId);
  const requestedTab = parseProgramsCockpitTab(searchParams?.tab);
  const requestedPeriod = parseProgramsCockpitPeriod(searchParams?.period);
  const view = await resolveProgramsCockpitView(sessionContext, searchParams);

  if (!view.account) {
    return <AccountEmptyState />;
  }

  const canonicalSearch = new URLSearchParams();
  canonicalSearch.set("accountId", String(view.account.id));
  canonicalSearch.set("tab", requestedTab);
  canonicalSearch.set("period", requestedPeriod);

  if (requestedAccountId !== view.account.id) {
    redirect(`/app/programs?${canonicalSearch.toString()}`);
  }

  return <ProgramsCockpitClient view={view} />;
}
