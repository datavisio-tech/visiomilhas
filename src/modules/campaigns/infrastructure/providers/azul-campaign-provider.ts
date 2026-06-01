import type { CampaignCatalogRepository } from "../../application/contracts";
import { BaseCampaignProvider } from "./base-campaign-provider";

export class AzulCampaignProvider extends BaseCampaignProvider {
  readonly sourceName = "Azul Fidelidade";

  constructor(repository: CampaignCatalogRepository) {
    super();
    void repository;
  }
}
