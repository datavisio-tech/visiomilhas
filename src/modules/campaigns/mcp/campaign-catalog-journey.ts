import type { CampaignRecord } from "../domain/types";

export type CampaignCatalogJourneyStep = {
  title: string;
  description: string;
};

export function buildCampaignCatalogJourney(
  campaigns: CampaignRecord[],
): CampaignCatalogJourneyStep[] {
  return [
    {
      title: "Carregar catálogo",
      description: `Receber ${campaigns.length} campanhas normalizadas para a operação.`,
    },
    {
      title: "Aplicar provedor",
      description:
        "Permitir que Livelo, Azul, Smiles, LATAM Pass e Esfera alimentem o catálogo no mesmo contrato.",
    },
    {
      title: "Preparar autofill",
      description:
        "Usar programa, parceiro, multiplicador e prazo de crédito para montar o futuro preenchimento da compra bonificada.",
    },
  ];
}
