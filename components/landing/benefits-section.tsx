import React from "react";
import MarketingSection from "../../components/ui/marketing-section";
import Image from "next/image";

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 shadow-[0_0_32px_rgba(124,58,237,0.22)] backdrop-blur-xl">
        <Image src={icon} alt="" width={24} height={24} className="h-6 w-6" />
      </span>
      <span>{title}</span>
    </span>
  );
}

export default function BenefitsSection() {
  return (
    <>
      <MarketingSection
        eyebrow="Controle financeiro"
        title={<SectionTitle icon="/assets/icons/icon-finance.svg" title="Performance com clareza absoluta" />}
        body={<p>Custo médio, lucro e saldo consolidado em um layout que parece um cockpit financeiro de produto premium.</p>}
        imageSrc="/assets/section-1.svg"
        cta={{ href: "/app/dashboard", label: "Explorar dashboard" }}
      />

      <MarketingSection
        eyebrow="Gestão de programas"
        title={<SectionTitle icon="/assets/icons/icon-programs.svg" title="Tudo centralizado em uma única camada operacional" />}
        body={<p>Múltiplos programas, contas e transferências reunidos com hierarquia visual forte, estados e fluidez.</p>}
        imageSrc="/assets/section-2.svg"
        reverse
        cta={{ href: "/app/dashboard", label: "Ver organização" }}
      />

      <MarketingSection
        eyebrow="Simulações"
        title={<SectionTitle icon="/assets/icons/icon-simulate.svg" title="Cenários rápidos com aparência de software de decisão" />}
        body={<p>Compare cenários antes de vender ou transferir com uma visualização que passa sensação de precisão e maturidade.</p>}
        imageSrc="/assets/section-3.svg"
        cta={{ href: "/app/purchases", label: "Simular agora" }}
      />
    </>
  );
}
