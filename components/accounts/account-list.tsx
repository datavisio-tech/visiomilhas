"use client";

import { useMemo, useState } from "react";
import { Card } from "../ui/card";
import Badge from "../ui/badge";
import EmptyState from "../ui/empty-state";
import AccountRow from "./account-row";
import NewAccountDialog from "./new-account-dialog";
import type {
  AccountOverview,
  AccountProgramOption,
} from "../../lib/data/accounts";

type DialogMode = "create" | "edit" | "view" | "adjust" | "inactive" | "delete";

export default function AccountList({
  accounts,
  programs,
}: {
  accounts: AccountOverview[];
  programs: AccountProgramOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedAccount, setSelectedAccount] =
    useState<AccountOverview | null>(null);

  const activeCount = useMemo(
    () => accounts.filter((account) => account.isActive).length,
    [accounts],
  );
  const averageCpm = useMemo(() => {
    const values = accounts
      .filter((account) => account.cpmCents > 0)
      .map((account) => account.cpmCents);
    if (!values.length) return 0;
    return Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }, [accounts]);

  function openDialog(mode: DialogMode, account?: AccountOverview | null) {
    setDialogMode(mode);
    setSelectedAccount(account ?? null);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {activeCount} ativas
        </Badge>
        <Badge>{accounts.length} contas</Badge>
        <Badge>
          CPM médio:{" "}
          {averageCpm > 0 ? `R$ ${(averageCpm / 100).toFixed(2)}` : "—"}
        </Badge>
      </div>

      <Card className="mt-5 overflow-hidden">
        {accounts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Nenhuma conta encontrada"
              description="Crie a primeira conta para organizar programas, saldo inicial e CPM em uma central limpa e operacional."
              actionLabel="Nova conta"
              supportingText="Múltiplas contas por programa suportadas"
            />
          </div>
        ) : (
          <div>
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                handlers={{
                  onView: () => openDialog("view", account),
                  onEdit: () => openDialog("edit", account),
                  onAdjustBalance: () => openDialog("adjust", account),
                  onInactivate: () => openDialog("inactive", account),
                  onDelete: () => openDialog("delete", account),
                }}
              />
            ))}
          </div>
        )}
      </Card>

      <NewAccountDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        programs={programs}
        account={selectedAccount}
      />
    </>
  );
}
