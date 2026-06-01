/* eslint-disable no-unused-vars */

import type { CampaignRecord } from "../domain/types";

export type CampaignProvider = {
  readonly sourceName: string;

  fetchCampaigns: () => Promise<CampaignRecord[]>;

  normalizeCampaigns: (...args: [CampaignRecord[]]) => CampaignRecord[];

  saveCampaigns: (...args: [number, CampaignRecord[]]) => Promise<void>;
};

export type CampaignCatalogRepository = {
  saveCampaigns: (
    ...args: [number, CampaignRecord[]]
  ) => Promise<CampaignRecord[]>;

  saveSnapshots: (...args: [number, CampaignRecord[]]) => Promise<void>;
};
