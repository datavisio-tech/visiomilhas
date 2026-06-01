import type { CampaignStatusValue, CampaignTypeValue } from "./enums";

export type CampaignRecord = {
  id?: number;
  organizationId?: number;
  partnerStoreId?: number | null;
  programId?: number | null;
  programSlug?: string | null;
  programName?: string | null;
  partnerSlug?: string | null;
  partnerName?: string | null;
  logoUrl?: string | null;
  campaignTitle?: string | null;
  campaignUrl?: string | null;
  countryCode?: string | null;
  campaignType?: CampaignTypeValue;
  pointsPerReal?: number | null;
  pointsPerDollar?: number | null;
  minimumPurchaseAmount?: number | null;
  couponCode?: string | null;
  requiresClub?: boolean;
  creditDeadlineDays?: number | null;
  campaignStartDate?: string | Date | null;
  campaignEndDate?: string | Date | null;
  scrapedAt?: string | Date | null;
  lastVerifiedAt?: string | Date | null;
  campaignStatus?: CampaignStatusValue;
  sourceType?: string | null;
  sourceName?: string | null;
  isFeatured?: boolean;
  title?: string | null;
  multiplier?: number;
  multiplierType?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  sourceUrl?: string | null;
  observedAt?: string | Date | null;
  isActive?: boolean;
};

export type CampaignSnapshotRecord = {
  campaignId?: number;
  pointsPerReal?: number | null;
  campaignStatus?: CampaignStatusValue;
  capturedAt?: string | Date | null;
  rawPayload?: unknown;
};

export type CampaignPickerOption = {
  id: string;
  label: string;
  partnerName?: string | null;
  logoUrl?: string | null;
  campaignUrl?: string | null;
  campaignType?: CampaignTypeValue;
};
