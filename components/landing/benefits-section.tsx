import React from "react";
import MarketingSection from "../../components/ui/marketing-section";

export default function BenefitsSection() {
  return (
    <>
      <MarketingSection
        title="Controle financeiro"
        body={
          <>
            <p className="mt-4 text-slate-600">Custo médio, lucro e saldo consolidado para decisões melhores.</p>
          </>
        }
        imageSrc="/assets/section-1.svg"
      />

      <MarketingSection
        title="Gestão de programas"
        body={<p className="mt-4 text-slate-600">Multiplos programas, contas e transferências centralizadas.</p>}
        imageSrc="/assets/section-2.svg"
        reverse
      />

      <MarketingSection
        title="Simulações"
        body={<p className="mt-4 text-slate-600">Compare cenários antes de vender ou transferir.</p>}
        imageSrc="/assets/section-3.svg"
      />
    </>
  );
}
