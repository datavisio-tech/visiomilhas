import "./styles.css";
import type { ReactNode } from "react";
import AppSidebar from "../../components/layout/app-sidebar";
import AppHeader from "../../components/layout/app-header";
import { resolveCurrentBetterAuthSessionContext } from "../../lib/server/better-auth-session";

export default async function AppAreaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sessionContext = await resolveCurrentBetterAuthSessionContext();
  const email = sessionContext?.auth.email ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] text-slate-950">
      <AppSidebar />
      <div className="ml-56">
        <AppHeader email={email} />
        <main className="px-8 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
