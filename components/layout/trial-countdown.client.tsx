"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "0d 00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TrialCountdown({
  trialEndsAt,
}: {
  trialEndsAt: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let expires = Date.parse(trialEndsAt);
  if (Number.isNaN(expires)) {
    try {
      expires = new Date(trialEndsAt).getTime();
    } catch (e) {
      expires = Date.now();
    }
  }

  const remaining = Math.max(0, expires - now);

  return (
    <div className="inline-flex items-center gap-3 rounded-md bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 7V12L15 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Expira em</span>
      <span className="font-semibold text-rose-700">
        {formatRemaining(remaining)}
      </span>
    </div>
  );
}
