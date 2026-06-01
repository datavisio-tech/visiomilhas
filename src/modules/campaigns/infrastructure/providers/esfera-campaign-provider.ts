import type { CampaignCatalogRepository } from "../../application/contracts";
import { BaseCampaignProvider } from "./base-campaign-provider";

export class EsferaCampaignProvider extends BaseCampaignProvider {
  readonly sourceName = "Esfera";

  constructor(repository: CampaignCatalogRepository) {
    super();
    void repository;
  }
}
