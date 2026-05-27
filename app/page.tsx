import MarketingHero from "../components/ui/marketing-hero";
import MarketingSection from "../components/ui/marketing-section";
import PrimaryButton from "../components/ui/button";
import React from "react";

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

      <MarketingHero />

      <MarketingSection
        title="Seus pontos, seus números, sua estratégia"
        body={
          <>
            <p className="mt-4">Veja a saúde de todos os programas, use CPM médio e o valor estimado de sua carteira.</p>
            <ul className="mt-4 list-inside list-disc text-slate-600">
              <li>Dashboard unificado de todos os programas</li>
              <li>Simule antes de decidir e compare cenários</li>
            </ul>
          </>
        }
        imageSrc="/assets/section-1.png"
      />

      <MarketingSection
        title="Simule antes de decidir"
        body={<p className="mt-4 text-slate-600">Transfira com bônus, compare cenários e estime o impacto no seu saldo.</p>}
        imageSrc="/assets/section-2.png"
        reverse
      />

      <MarketingSection
        title="Acompanhe bônus e nunca perca uma oportunidade"
        body={<p className="mt-4 text-slate-600">Receba alertas e acompanhe históricos por parceiro e por CPF.</p>}
        imageSrc="/assets/section-3.png"
      />

      <section id="pricing" className="py-20 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-semibold mb-3">Pronto para organizar suas milhas?</h3>
          <p className="mb-6 max-w-2xl mx-auto">Comece gratuitamente e experimente todas as funcionalidades PRO por 15 dias.</p>
          <div className="flex justify-center gap-4">
            <PrimaryButton>
              <a href="/sign-in?callbackUrl=/app/dashboard">Começar grátis</a>
            </PrimaryButton>
            <a href="/sign-in?callbackUrl=/app/dashboard" className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-white bg-opacity-20">Ver demo</a>
          </div>
        </div>
      </section>
    </main>
  );
}
