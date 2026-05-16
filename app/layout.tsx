import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "VisioMilhas",
  description: "Controle de milhas e pontos - VisioMilhas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
