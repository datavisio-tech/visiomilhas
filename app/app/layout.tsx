import "./styles.css";
import type { ReactNode } from "react";
import AppSidebar from "../../components/layout/app-sidebar";
import AppHeader from "../../components/layout/app-header";
import { resolveCurrentBetterAuthSessionContext } from "../../lib/server/better-auth-session";

export default async function AppAreaLayout({ children }: { children: ReactNode }) {
  const sessionContext = await resolveCurrentBetterAuthSessionContext();
  const email = sessionContext?.auth.email ?? null;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-950">
      <AppSidebar />
      <div className="ml-72">
        <AppHeader email={email} />
        <main className="px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
