"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AccountProgramOption } from "../../lib/data/accounts";
import ProgramOption from "./program-option";

/* eslint-disable no-unused-vars */
type Props = {
  selectedProgramId: string;
  onChange: (v: string) => void;
  programs: AccountProgramOption[];
  disabled?: boolean;
  required?: boolean;
};
/* eslint-enable no-unused-vars */

export default function ProgramSelector({
  selectedProgramId,
  onChange,
  programs,
  disabled,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const selected = programs.find(
    (p) => String(p.id) === String(selectedProgramId),
  );

  const filtered = programs.filter((p) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm text-slate-900">
              {selected ? (
                selected.name
              ) : (
                <span className="text-slate-400">Selecione</span>
              )}
            </div>
            <div className="text-xs text-slate-500">{selected?.slug ?? ""}</div>
          </div>

          <div className="text-xs text-slate-500">▾</div>
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-3">
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Pesquisar programa"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-auto px-1 py-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">
                Nenhum programa encontrado
              </div>
            ) : (
              filtered.map((program) => (
                <div
                  key={program.id}
                  onClick={() => {
                    onChange(String(program.id));
                    setOpen(false);
                  }}
                >
                  <ProgramOption
                    program={program}
                    selected={String(program.id) === String(selectedProgramId)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {required && !selectedProgramId ? (
        <input type="hidden" aria-hidden value="" />
      ) : null}
    </div>
  );
}
