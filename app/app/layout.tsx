import "./styles.css";
import type { ReactNode } from "react";
import AppSidebar from "../../components/layout/app-sidebar";
import AppHeader from "../../components/layout/app-header";
import { resolveCurrentBetterAuthSessionContext } from "../../lib/server/better-auth-session";

export default async function AppAreaLayout({ children }: { children: ReactNode }) {
  const sessionContext = await resolveCurrentBetterAuthSessionContext();
  const email = sessionContext?.auth.email ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader email={email} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
