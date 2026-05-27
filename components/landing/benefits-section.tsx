import React from "react";
import MarketingSection from "../../components/ui/marketing-section";

export default function BenefitsSection() {
  return (
    <>
      <MarketingSection
        title={<span className="flex items-center gap-3"><img src="/assets/icons/icon-finance.svg" alt="finance" className="w-6 h-6"/> Controle financeiro</span>}
        body={
          <>
            <p className="mt-4 text-slate-600">Custo médio, lucro e saldo consolidado para decisões melhores.</p>
          </>
        }
        imageSrc="/assets/section-1.svg"
      />

      <MarketingSection
        title={<span className="flex items-center gap-3"><img src="/assets/icons/icon-programs.svg" alt="programs" className="w-6 h-6"/> Gestão de programas</span>}
        body={<p className="mt-4 text-slate-600">Multiplos programas, contas e transferências centralizadas.</p>}
        imageSrc="/assets/section-2.svg"
        reverse
      />

      <MarketingSection
        title={<span className="flex items-center gap-3"><img src="/assets/icons/icon-simulate.svg" alt="simulate" className="w-6 h-6"/> Simulações</span>}
        body={<p className="mt-4 text-slate-600">Compare cenários antes de vender ou transferir.</p>}
        imageSrc="/assets/section-3.svg"
      />
    </>
  );
}
