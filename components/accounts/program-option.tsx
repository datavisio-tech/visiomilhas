"use client";

import React from "react";
import type { AccountProgramOption } from "../../lib/data/accounts";

type Props = {
  program: AccountProgramOption;
  onClick?: () => void;
  selected?: boolean;
};

export default function ProgramOption({ program, onClick, selected }: Props) {
  const initials = program.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-50 ${
        selected ? "bg-slate-100" : ""
      }`}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold text-white"
        style={{ background: program.color || "#94a3b8" }}
      >
        {initials}
      </div>

      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 select-text">
          {program.name}
        </div>
        <div className="text-xs text-slate-500 select-text">
          {program.slug ?? ""}
        </div>
      </div>

      {!program.isActive ? (
        <div className="text-xs text-amber-700">Inativo</div>
      ) : null}
    </div>
  );
}
