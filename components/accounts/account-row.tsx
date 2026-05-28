import Badge from "../ui/badge";
import Separator from "../ui/separator";
import ProgramBadge from "./program-badge";
import AccountActionsDropdown, {
  type AccountActionHandlers,
} from "./account-actions-dropdown";
import { formatCpmCents } from "../../lib/accounts";
import type { AccountOverview } from "../../lib/data/accounts";

export default function AccountRow({
  account,
  handlers,
}: {
  account: AccountOverview;
  handlers: AccountActionHandlers;
}) {
  return (
    <div className="px-5 py-4 transition hover:bg-slate-50/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <ProgramBadge
            programName={account.program}
            color={account.programColor}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-950">
              {account.displayName}
            </h3>
            {!account.isActive ? (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                Inativa
              </Badge>
            ) : (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Ativa
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {account.program ?? "Programa"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:min-w-[280px] sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Saldo atual
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {account.balance.toLocaleString("pt-BR")} pts
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              CPM médio
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {formatCpmCents(account.cpmCents)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <AccountActionsDropdown handlers={handlers} />
        </div>
      </div>
      <Separator className="mt-4" />
    </div>
  );
}
