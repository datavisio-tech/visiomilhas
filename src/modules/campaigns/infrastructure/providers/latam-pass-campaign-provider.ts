import type { CampaignCatalogRepository } from "../../application/contracts";
import { BaseCampaignProvider } from "./base-campaign-provider";

export class LatamPassCampaignProvider extends BaseCampaignProvider {
  readonly sourceName = "LATAM Pass";

  constructor(repository: CampaignCatalogRepository) {
    super();
    void repository;
  }
}
