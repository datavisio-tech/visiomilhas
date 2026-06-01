import type { CampaignCatalogRepository } from "../../application/contracts";
import { BaseCampaignProvider } from "./base-campaign-provider";

export class LiveloCampaignProvider extends BaseCampaignProvider {
  readonly sourceName = "Livelo";

  constructor(repository: CampaignCatalogRepository) {
    super();
    void repository;
  }
}
