import type { CampaignProvider } from "../../application/contracts";
import { normalizeCampaignRecord } from "../../application/services";
import type { CampaignRecord } from "../../domain/types";

export abstract class BaseCampaignProvider implements CampaignProvider {
  abstract readonly sourceName: string;

  async fetchCampaigns(): Promise<CampaignRecord[]> {
    return [];
  }

  normalizeCampaigns(...args: [CampaignRecord[]]): CampaignRecord[] {
    return args[0].map(normalizeCampaignRecord);
  }

  async saveCampaigns(..._args: [number, CampaignRecord[]]): Promise<void> {
    void _args;
    return;
  }
}
