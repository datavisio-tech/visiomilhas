import React from "react";
import HeroSection from "../components/landing/hero-section";
import BenefitsSection from "../components/landing/benefits-section";
import HowItWorksSection from "../components/landing/how-it-works-section";
import MockupsSection from "../components/landing/mockups-section";
import FinalCtaSection from "../components/landing/final-cta-section";
import LandingFooter from "../components/landing/footer";
import ShadcnButton from "../components/ui/shadcn-button";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/70 px-6 py-4 backdrop-blur-2xl lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.35)]">
              V
            </div>
            <div>
              <div className="text-sm font-semibold text-white">VisioMilhas</div>
              <div className="text-xs text-white/45">Premium SaaS para milhas</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-white/65 md:flex">
            <a href="#features" className="transition hover:text-white">
              Recursos
            </a>
            <a href="#mockups" className="transition hover:text-white">
              Painéis interativos
            </a>
            <ShadcnButton href="/app/dashboard" variant="outline" className="px-4 py-2 text-sm">
              Ver plataforma
            </ShadcnButton>
          </nav>
        </div>
      </header>

      <HeroSection />
      <div id="features">
        <BenefitsSection />
      </div>
      <HowItWorksSection />
      <div id="mockups">
        <MockupsSection />
      </div>

      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
