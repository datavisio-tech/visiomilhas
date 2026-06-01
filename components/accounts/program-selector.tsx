"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AccountProgramOption } from "../../lib/data/accounts";
import ProgramOption from "./program-option";
import LOYALTY_CATALOG from "../../data/loyalty-programs.json";

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
  const [selectedFallback, setSelectedFallback] = useState<{
    id: string;
    name: string;
    slug?: string | null;
    color?: string | null;
  } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const selected =
    programs.find((p) => String(p.id) === String(selectedProgramId)) ??
    (selectedFallback && String(selectedFallback.id) === String(selectedProgramId)
      ? selectedFallback
      : null);

  useEffect(() => {
    if (!selectedProgramId) {
      setSelectedFallback(null);
      return;
    }

    const matched = programs.find((p) => String(p.id) === String(selectedProgramId));
    if (matched) {
      setSelectedFallback(null);
    }
  }, [programs, selectedProgramId]);

  // build merged list: DB programs first, then catalog items not present in DB
  const catalog = (LOYALTY_CATALOG as any[]).map((p) => ({
    __catalog: true,
    key: `catalog:${p.slug}`,
    id: `catalog:${p.slug}`,
    name: p.name,
    slug: p.slug,
    color: p.brand_color || null,
    isActive: true,
  }));

  const merged = [
    ...programs,
    ...catalog.filter(
      (c) => !programs.some((db) => String(db.slug) === String(c.slug)),
    ),
  ];

  const q = filter.trim().toLowerCase();
  const filtered = merged.filter((p: any) => {
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
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
            <div className="text-sm text-slate-900 select-text">
              {selected ? (
                selected.name
              ) : (
                <span className="text-slate-400">Selecione</span>
              )}
            </div>
            <div className="text-xs text-slate-500 select-text">
              {selected?.slug ?? ""}
            </div>
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
                <div key={program.id}>
                  <div
                    onClick={async () => {
                      // if catalog item (id starts with 'catalog:') create in DB first
                      if (String(program.id).startsWith("catalog:")) {
                        try {
                          const res = await fetch(
                            "/api/loyalty-programs/create",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ slug: program.slug }),
                            },
                          );
                          const json = await res.json();
                          if (json?.success && json.programId) {
                            setSelectedFallback({
                              id: String(json.programId),
                              name: program.name,
                              slug: program.slug,
                              color: program.color,
                            });
                            onChange(String(json.programId));
                          } else {
                            // fallback: do nothing
                            // eslint-disable-next-line no-console
                            console.error("failed to create program", json);
                          }
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error(err);
                        }
                      } else {
                        onChange(String(program.id));
                      }
                      setOpen(false);
                    }}
                  >
                    <ProgramOption
                      program={program as any}
                      selected={
                        String(program.id) === String(selectedProgramId)
                      }
                    />
                  </div>
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
