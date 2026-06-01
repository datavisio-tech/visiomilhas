import Badge from "../ui/badge";
import AccountActionsDropdown, {
  type AccountActionHandlers,
} from "./account-actions-dropdown";
import { formatCpmCents } from "../../lib/accounts";
import type { AccountOverview } from "../../lib/data/accounts";
import { TableCell, TableRow } from "../ui/table";
import Link from "next/link";

export default function AccountRow({
  account,
  handlers,
  programsHref,
}: {
  account: AccountOverview;
  handlers: AccountActionHandlers;
  programsHref: string;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: account.programColor ?? "#64748b" }}
            aria-hidden
          >
            {getProgramInitials(account.program)}
          </div>
          <div className="min-w-0">
            <Link
              href={programsHref}
              className="truncate text-sm font-semibold text-slate-950 hover:text-emerald-700"
            >
              {account.program ?? "Programa"}
            </Link>
            <div className="truncate text-xs text-slate-500">
              {account.programSlug ?? "Sem slug"}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="min-w-0">
          <Link
            href={programsHref}
            className="truncate text-sm font-medium text-slate-950 hover:text-emerald-700"
          >
            {account.displayName}
          </Link>
          <div className="truncate text-xs text-slate-500">
            {account.holderName ?? "Conta operacional"}
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right whitespace-nowrap text-sm font-semibold text-slate-950">
        {account.balance.toLocaleString("pt-BR")} pts
      </TableCell>

      <TableCell className="text-right whitespace-nowrap text-sm text-slate-700">
        {formatCpmCents(account.cpmCents)}
      </TableCell>

      <TableCell>
        {account.isActive ? (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Ativa
          </Badge>
        ) : (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
            Inativa
          </Badge>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm text-slate-500">
        {formatDate(account.updatedAt)}
      </TableCell>

      <TableCell className="text-right">
        <AccountActionsDropdown
          handlers={handlers}
          accountId={account.id}
          isActive={account.isActive}
        />
      </TableCell>
    </TableRow>
  );
}

function getProgramInitials(programName?: string | null) {
  const fallback = (programName ?? "PR").trim();
  return fallback
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR");
}
