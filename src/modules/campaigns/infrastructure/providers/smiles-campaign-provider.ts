import type { CampaignCatalogRepository } from "../../application/contracts";
import { BaseCampaignProvider } from "./base-campaign-provider";

export class SmilesCampaignProvider extends BaseCampaignProvider {
  readonly sourceName = "Smiles";

  constructor(repository: CampaignCatalogRepository) {
    super();
    void repository;
  }
}
