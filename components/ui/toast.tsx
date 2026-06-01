"use client";

type ToastOptions = {
  title: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive" | "success";
};

export function showToast({
  title,
  description,
  duration = 3500,
  variant = "default",
}: ToastOptions) {
  if (typeof document === "undefined") return;

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const container = document.createElement("div");
  container.id = id;
  container.className =
    "fixed right-4 bottom-6 z-[9999] max-w-xs animate-slide-in";

  const bg =
    variant === "destructive"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : variant === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-white border-slate-200 text-slate-900";

  container.innerHTML = `
    <div class="rounded-lg border px-4 py-3 shadow-sm ${bg}">
      <div class="text-sm font-semibold">${escapeHtml(title)}</div>
      ${description ? `<div class="mt-1 text-xs text-slate-700">${escapeHtml(description)}</div>` : ""}
    </div>
  `;

  document.body.appendChild(container);

  setTimeout(() => {
    container.classList.add("opacity-0");
    setTimeout(() => container.remove(), 300);
  }, duration);
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default showToast;
