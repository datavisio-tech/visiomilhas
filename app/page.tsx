import React from "react";
import HeroSection from "../components/landing/hero-section";
import BenefitsSection from "../components/landing/benefits-section";
import HowItWorksSection from "../components/landing/how-it-works-section";
import MockupsSection from "../components/landing/mockups-section";
import FinalCtaSection from "../components/landing/final-cta-section";
import LandingFooter from "../components/landing/footer";

export default function Home() {
  return (
    <main className="bg-white">
      <header className="border-b p-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-indigo-600">VisioMilhas</div>
        <nav className="space-x-4">
          <a href="#features" className="text-gray-700">
            Recursos
          </a>
          <a href="#pricing" className="text-gray-700">
            Preços
          </a>
          <a href="/sign-in?callbackUrl=/app/dashboard" className="text-indigo-600 font-semibold">
            Entrar
          </a>
        </nav>
      </header>

      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <MockupsSection />

      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
