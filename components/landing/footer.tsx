import React from "react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-8 text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-8">
        <div className="text-sm font-semibold text-white">VisioMilhas</div>
        <div className="flex gap-4 text-sm text-white/55">
          <a href="#">Termos</a>
          <a href="#">Privacidade</a>
          <a href="#">Contato</a>
        </div>
        <div className="text-sm text-white/45">© {new Date().getFullYear()} DataVisio</div>
      </div>
    </footer>
  );
}
