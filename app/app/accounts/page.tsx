export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";
import { getAccountsCenterOverview } from "../../../lib/data/accounts";
import AccountsCenter from "../../../components/accounts/accounts-center";

export default async function AccountsPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "accounts.page",
    allowFallback: false,
  });

  if (!sessionContext) {
    redirect("/sign-in?callbackUrl=/app/accounts");
  }

  const { accounts, programs } =
    await getAccountsCenterOverview(sessionContext);

  return <AccountsCenter accounts={accounts} programs={programs} />;
}
