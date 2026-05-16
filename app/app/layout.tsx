import "./styles.css";
import type { ReactNode } from "react";
import AppSidebar from "../../components/layout/app-sidebar";
import AppHeader from "../../components/layout/app-header";

export default function AppAreaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
