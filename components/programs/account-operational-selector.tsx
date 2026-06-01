/* eslint-disable no-unused-vars */
"use client";

import type { AccountOverview } from "../../lib/data/accounts";
import Select from "../ui/select";

type Props = {
  accounts: AccountOverview[];
  selectedAccountId: number;
  compact?: boolean;
  onChange?: (_accountId: number) => void;
};

export default function AccountOperationalSelector({
  accounts,
  selectedAccountId,
  compact,
  onChange,
}: Props) {
  return (
    <div
      className={
        compact
          ? "space-y-2"
          : "rounded-card border border-slate-200 bg-white p-4 shadow-card"
      }
    >
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Conta ativa
      </div>
      <div className={compact ? "" : "mt-3"}>
        <Select
          aria-label="Conta ativa"
          value={String(selectedAccountId)}
          onChange={(event) => onChange?.(Number(event.target.value))}
        >
          {accounts.map((account) => (
            <option key={account.id} value={String(account.id)}>
              {account.displayName} {account.isActive ? "(Ativa)" : "(Inativa)"}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
