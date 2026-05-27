import React from "react";
import MarketingSection from "../../components/ui/marketing-section";
import Image from "next/image";

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 shadow-[0_0_32px_rgba(124,58,237,0.22)] backdrop-blur-xl">
        <Image src={icon} alt="" width={24} height={24} className="shrink-0" />
      </span>
      <span>{title}</span>
    </span>
  );
}

export default function BenefitsSection() {
  return (
    <>
      <MarketingSection
        eyebrow="Situação"
        title={<SectionTitle icon="/assets/icons/icon-finance.svg" title="Quando tudo fica solto, a margem some no detalhe" />}
        body={<p>Planilhas, alertas e decisões espalhadas deixam o custo obscuro. Aqui a leitura financeira vira uma visão única, clara e pronta para agir.</p>}
        imageSrc="/assets/section-1.svg"
        cta={{ href: "/app/dashboard", label: "Ver a leitura financeira" }}
      />

      <MarketingSection
        eyebrow="Solução"
        title={<SectionTitle icon="/assets/icons/icon-programs.svg" title="A central operacional organiza programas, contas e próximos passos" />}
        body={<p>VisioMilhas reúne saldo, histórico e movimentações em uma superfície única que reduz ruído e deixa a operação pronta para escalar.</p>}
        imageSrc="/assets/section-2.svg"
        reverse
        cta={{ href: "/app/dashboard", label: "Centralizar minha operação" }}
      />

      <MarketingSection
        eyebrow="Benefício"
        title={<SectionTitle icon="/assets/icons/icon-simulate.svg" title="Decisões melhores porque o lucro aparece antes da ação" />}
        body={<p>Compare cenários, enxergue o custo e escolha o melhor momento para vender ou transferir com mais confiança e menos adivinhação.</p>}
        imageSrc="/assets/section-3.svg"
        cta={{ href: "/app/purchases", label: "Simular com clareza" }}
      />
    </>
  );
}
