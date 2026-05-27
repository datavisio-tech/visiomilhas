import React from "react";

export default function LandingFooter() {
  return (
    <footer className="border-t bg-white py-8">
      <div className="container mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm font-semibold text-indigo-600">VisioMilhas</div>
        <div className="flex gap-4 text-sm text-slate-600">
          <a href="#">Termos</a>
          <a href="#">Privacidade</a>
          <a href="#">Contato</a>
        </div>
        <div className="text-sm text-slate-500">© {new Date().getFullYear()} DataVisio</div>
      </div>
    </footer>
  );
}
