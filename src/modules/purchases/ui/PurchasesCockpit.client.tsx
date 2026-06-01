"use client";

import React, { useCallback, useEffect, useState } from "react";

type PurchaseRow = {
  id: number;
  status: string;
  title?: string | null;
  orderNumber?: string | null;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  programName?: string | null;
  programId?: number | null;
  accountName?: string | null;
  accountId?: number | null;
  purchaseAmountCents?: number | null;
  multiplier?: number | null;
  expectedPoints?: number | null;
  purchaseDate?: string | null;
  expectedCreditDate?: string | null;
  updatedAt?: string | null;
};

function Filters({
  onFilter,
  visible = 0,
}: {
  onFilter: any;
  visible?: number;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  // apply search with debounce — results are fetched from server via onFilter
  useEffect(() => {
    const t = setTimeout(() => {
      onFilter({
        q: q.trim() ? q.trim() : undefined,
        status: status === "all" ? undefined : status,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, status, onFilter]);

  return (
    <div className="border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Lista de compras
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Busque por programa, conta, titular ou status.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
            role="status"
            aria-live="polite"
          >
            {visible} visíveis
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Todos os status
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-slate-400"
              aria-hidden="true"
            >
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
          </span>
          <input
            aria-label="Buscar compras"
            placeholder="Buscar por programa, conta ou titular"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 pl-10"
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-slate-400"
              aria-hidden="true"
            >
              <path d="M10 5H3"></path>
              <path d="M12 19H3"></path>
              <path d="M14 3v4"></path>
              <path d="M16 17v4"></path>
              <path d="M21 12h-9"></path>
              <path d="M21 19h-5"></path>
              <path d="M21 5h-7"></path>
              <path d="M8 10v4"></path>
              <path d="M8 12H3"></path>
            </svg>
          </span>
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 pl-10"
          >
            <option value="all">Todos os status</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="TRACKED">TRACKED</option>
            <option value="PENDING_CREDIT">PENDING_CREDIT</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="PROBLEM">PROBLEM</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function SecondaryTable({
  rows,
  onOpen,
}: {
  rows: PurchaseRow[];
  onOpen: any;
}) {
  return (
    <table className="w-full bg-white text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-500">
          <th className="p-2">Produto</th>
          <th className="p-2">Loja</th>
          <th className="p-2">Status</th>
          <th className="p-2">Valor</th>
          <th className="p-2">Ações</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-slate-100">
            <td className="p-2">{row.title}</td>
            <td className="p-2">{formatDisplayName(row.partnerName)}</td>
            <td className="p-2">{row.status}</td>
            <td className="p-2">
              R$ {((row.purchaseAmountCents || 0) / 100).toFixed(2)}
            </td>
            <td className="p-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                onClick={() => onOpen(row.id)}
              >
                Detalhes
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDisplayName(value?: string | null) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function PurchaseDetails({ id }: { id: number }) {
  const [data, setData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    fetch(`/api/purchases/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j));
  }, [id]);

  if (!data) return <div>Carregando...</div>;
  const purchase = data.purchase;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-950">
        {purchase?.title || `Compra ${id}`}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{purchase?.status}</p>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div>Produto: {purchase?.title}</div>
        <div>
          Conta destino:{" "}
          {formatDisplayName(purchase?.accountName) || purchase?.accountId}
        </div>
        <div>
          Programa:{" "}
          {formatDisplayName(purchase?.programName) || purchase?.programId}
        </div>
        <div>
          Valor: R$ {((purchase?.purchaseAmountCents || 0) / 100).toFixed(2)}
        </div>
      </div>

      <h3 className="mt-6 font-medium text-slate-900">Timeline</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {(data.history || []).map((item: any, index: number) => (
          <li key={index}>
            {new Date(item.createdAt).toLocaleString()} — {item.oldStatus} →{" "}
            {item.newStatus}
          </li>
        ))}
      </ul>

      <h3 className="mt-6 font-medium text-slate-900">Evidências</h3>
      <div className="mt-2">
        <ul className="space-y-2 text-sm text-slate-600">
          {(data.evidences || []).map((item: any, index: number) => (
            <li key={index}>
              <a
                className="text-sky-700 underline"
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                {item.fileName || item.fileUrl}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Adicionar evidência (esqueleto de upload)
          </label>
          <input
            key={fileInputKey}
            type="file"
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                // NOTE: this is a skeleton. In production, upload file to storage and pass public URL.
                const fileUrl = URL.createObjectURL(file);
                const payload = {
                  fileName: file.name,
                  fileType: file.type,
                  fileUrl,
                };
                const res = await fetch(`/api/purchases/${id}/evidences`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const j = await res.json();
                if (res.ok) {
                  // refresh
                  const refreshed = await fetch(`/api/purchases/${id}`);
                  const json = await refreshed.json();
                  setData(json);
                  // reset file input
                  setFileInputKey((k) => k + 1);
                } else {
                  console.error("upload error", j);
                  alert(j.error || "Falha ao enviar evidência");
                }
              } catch (err) {
                console.error(err);
                alert("Erro no upload");
              } finally {
                setUploading(false);
              }
            }}
          />
          {uploading && <div className="mt-2 text-sm">Enviando...</div>}
        </div>
      </div>
    </div>
  );
}

function statusColorClass(status?: string) {
  switch (status) {
    case "REGISTERED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "TRACKED":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "PENDING_CREDIT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "RECEIVED":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
    case "PROBLEM":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PurchasesCockpit({
  organizationId,

  initialList,
}: {
  organizationId: number;
  initialKpis: Record<string, number>;
  initialList: PurchaseRow[];
}) {
  const [list, setList] = useState<PurchaseRow[]>(initialList || []);
  const [visibleCount, setVisibleCount] = useState<number>(
    initialList?.length || 0,
  );
  const [drawerId, setDrawerId] = useState<number | null>(null);

  useEffect(() => {
    setList(initialList || []);
    setVisibleCount(initialList?.length || 0);
  }, [initialList]);

  const loadPurchases = useCallback(
    async (filters: { q?: string; status?: string } = {}) => {
      const qs = new URLSearchParams({
        organizationId: String(organizationId),
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      });
      const res = await fetch(`/api/purchases?${qs.toString()}`);
      const json = await res.json();
      if (Array.isArray(json?.items)) {
        setList(json.items);
        const serverTotal =
          typeof json.total === "number" ? json.total : json.items.length;
        setVisibleCount(serverTotal);
      }
    },
    [organizationId],
  );

  const refreshAll = useCallback(async () => {
    await loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    function handler() {
      refreshAll();
    }

    window.addEventListener("purchases:created", handler);
    return () => window.removeEventListener("purchases:created", handler);
  }, [refreshAll]);

  const columns = [
    { key: "REGISTERED", title: "Aguardando Entrega" },
    { key: "TRACKED", title: "Rastreada" },
    { key: "PENDING_CREDIT", title: "Aguardando Crédito" },
    { key: "RECEIVED", title: "Pontos Recebidos" },
    { key: "PROBLEM", title: "Problemas" },
  ] as const;

  function onDragStart(e: React.DragEvent<HTMLElement>, id: number) {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>, status: string) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (!id) return;

    const previous = list.find((item) => item.id === id)?.status;
    if (!previous) return;

    setList((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );

    const response = await fetch("/api/purchases/change-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const result = await response.json();

    if (!response.ok || result?.error) {
      setList((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: previous } : item,
        ),
      );
      return;
    }

    await refreshAll();
  }

  function renderCard(purchase: PurchaseRow) {
    const amount = (purchase.purchaseAmountCents || 0) / 100;
    const points =
      purchase.expectedPoints ??
      Math.round(amount * (purchase.multiplier || 0));

    return (
      <article
        key={purchase.id}
        draggable
        data-purchase-card="true"
        data-purchase-id={purchase.id}
        onDragStart={(e) => onDragStart(e, purchase.id)}
        onClick={() => setDrawerId(purchase.id)}
        className="mb-3 cursor-grab overflow-hidden rounded-2xl bg-white shadow transition hover:shadow-lg"
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
              {purchase.partnerLogoUrl ? (
                <img
                  src={purchase.partnerLogoUrl}
                  alt={purchase.partnerName || "Loja"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="uppercase">
                  {formatDisplayName(purchase.partnerName || "LOJA").slice(
                    0,
                    2,
                  )}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">
                {formatDisplayName(purchase.partnerName) || "Loja Parceira"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <div className="truncate">{purchase.title}</div>
                {purchase.orderNumber && (
                  <div className="ml-auto rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    #{purchase.orderNumber}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusColorClass(
                  purchase.status,
                )}`}
              >
                {purchase.status}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="grid w-full grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Programa</dt>
                <dd className="truncate font-medium text-slate-900">
                  {formatDisplayName(purchase.programName) ||
                    (purchase.programId
                      ? `Programa ${purchase.programId}`
                      : "—")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Conta</dt>
                <dd className="truncate font-medium text-slate-900">
                  {formatDisplayName(purchase.accountName) ||
                    (purchase.accountId ? `Conta ${purchase.accountId}` : "—")}
                </dd>
              </div>
            </div>

            <div className="ml-4 flex flex-col items-end">
              <div className="text-sm font-semibold text-slate-900">
                R$ {amount.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500">{points} pts</div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div>
              Multiplicador:{" "}
              <span className="font-medium text-slate-900">
                {purchase.multiplier ?? "—"}
              </span>
            </div>
            <div>
              Compra:{" "}
              <span className="font-medium text-slate-900">
                {purchase.purchaseDate
                  ? new Date(purchase.purchaseDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <div>
              Crédito:{" "}
              <span className="font-medium text-slate-900">
                {purchase.expectedCreditDate
                  ? new Date(purchase.expectedCreditDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div data-purchases-organization-id={organizationId}>
      {/* Header actions moved to PageHeader via actions prop; cockpit listens for purchases:created */}
      <Filters onFilter={loadPurchases} visible={visibleCount} />

      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <section
            key={column.key}
            className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
                {column.title}
              </h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                {list.filter((item) => item.status === column.key).length}
              </span>
            </header>

            <div
              data-purchase-dropzone={column.key}
              className="flex-1 space-y-2"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, column.key)}
            >
              {list
                .filter((item) => item.status === column.key)
                .map(renderCard)}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-700">
          Tabela secundária
        </div>
        <SecondaryTable rows={list} onOpen={setDrawerId} />
      </section>

      {drawerId && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40">
          <div className="max-h-[80vh] w-full overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">
                Timeline e auditoria
              </h3>
              <button
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
                onClick={() => setDrawerId(null)}
              >
                Fechar
              </button>
            </div>
            <PurchaseDetails id={drawerId} />
          </div>
        </div>
      )}
    </div>
  );
}
