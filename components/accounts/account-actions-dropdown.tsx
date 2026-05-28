"use client";

import {
  MoreHorizontal,
  Eye,
  PencilLine,
  PiggyBank,
  Power,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type AccountActionHandlers = {
  onView: () => void;
  onEdit: () => void;
  onAdjustBalance: () => void;
  onInactivate: () => void;
  onDelete: () => void;
};

export default function AccountActionsDropdown({
  handlers,
}: {
  handlers: AccountActionHandlers;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlers.onView}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlers.onEdit}>
          <PencilLine className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlers.onAdjustBalance}>
          <PiggyBank className="mr-2 h-4 w-4" />
          Ajustar saldo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlers.onInactivate}>
          <Power className="mr-2 h-4 w-4" />
          Inativar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handlers.onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
