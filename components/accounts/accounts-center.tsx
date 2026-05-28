"use client";

import { Plus } from "lucide-react";
import PageHeader from "../ui/page-header";
import Button from "../ui/button";
import AccountList from "./account-list";
import NewAccountDialog from "./new-account-dialog";
import { useState } from "react";
import type {
  AccountOverview,
  AccountProgramOption,
} from "../../lib/data/accounts";

export default function AccountsCenter({
  accounts,
  programs,
}: {
  accounts: AccountOverview[];
  programs: AccountProgramOption[];
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        eyebrow="Operação"
        subtitle="Gerencie as contas vinculadas aos seus programas de milhas."
        actions={
          <Button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova conta
          </Button>
        }
      />

      <AccountList accounts={accounts} programs={programs} />

      <NewAccountDialog
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        programs={programs}
        account={null}
      />
    </div>
  );
}
