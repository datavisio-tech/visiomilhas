"use client";
import { useEffect, useState } from "react";

export type SubscriptionAccessInfo = {
  ok: boolean;
  accessState?: string | null;
  subscriptionStatus?: string | null;
  canWrite?: boolean;
  error?: string | null;
};

export default function useSubscriptionAccess() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionAccessInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/subscription/access", {
          cache: "no-store",
        });
        const j = await res.json();
        if (!mounted) return;
        setData(j);
      } catch (err: any) {
        if (!mounted) return;
        setData({ ok: false, error: err?.message ?? String(err) });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, data } as const;
}
