import { CampaignStatus, CampaignType } from "../domain/enums";
import type { CampaignRecord } from "../domain/types";
import type { CampaignCatalogRepository, CampaignProvider } from "./contracts";

function resolveCampaignType(
  campaignType: CampaignRecord["campaignType"],
): CampaignRecord["campaignType"] {
  return campaignType ?? CampaignType.POINTS_PER_REAL;
}

function resolveCampaignStatus(
  campaignStatus: CampaignRecord["campaignStatus"],
): CampaignRecord["campaignStatus"] {
  return campaignStatus ?? CampaignStatus.UNKNOWN;
}

export function normalizeCampaignRecord(
  campaign: CampaignRecord,
): CampaignRecord {
  const resolvedCampaignType = resolveCampaignType(campaign.campaignType);
  const resolvedCampaignStatus = resolveCampaignStatus(campaign.campaignStatus);
  const multiplier =
    campaign.multiplier ??
    campaign.pointsPerReal ??
    campaign.pointsPerDollar ??
    0;

  return {
    ...campaign,
    campaignType: resolvedCampaignType,
    campaignStatus: resolvedCampaignStatus,
    campaignTitle: campaign.campaignTitle ?? campaign.title ?? null,
    title: campaign.title ?? campaign.campaignTitle ?? null,
    campaignUrl: campaign.campaignUrl ?? campaign.sourceUrl ?? null,
    sourceUrl: campaign.sourceUrl ?? campaign.campaignUrl ?? null,
    partnerName: campaign.partnerName ?? null,
    partnerSlug: campaign.partnerSlug ?? null,
    programName: campaign.programName ?? null,
    programSlug: campaign.programSlug ?? null,
    logoUrl: campaign.logoUrl ?? null,
    pointsPerReal: campaign.pointsPerReal ?? null,
    pointsPerDollar: campaign.pointsPerDollar ?? null,
    minimumPurchaseAmount: campaign.minimumPurchaseAmount ?? null,
    couponCode: campaign.couponCode ?? null,
    requiresClub: campaign.requiresClub ?? false,
    creditDeadlineDays: campaign.creditDeadlineDays ?? null,
    campaignStartDate: campaign.campaignStartDate ?? campaign.startsAt ?? null,
    campaignEndDate: campaign.campaignEndDate ?? campaign.endsAt ?? null,
    scrapedAt: campaign.scrapedAt ?? campaign.observedAt ?? null,
    lastVerifiedAt: campaign.lastVerifiedAt ?? campaign.observedAt ?? null,
    sourceType: campaign.sourceType ?? "seed",
    sourceName: campaign.sourceName ?? "campaigns-seed.json",
    isFeatured: campaign.isFeatured ?? false,
    multiplier,
    multiplierType:
      campaign.multiplierType ??
      (resolvedCampaignType === CampaignType.POINTS_PER_DOLLAR
        ? "points_per_dollar"
        : resolvedCampaignType === CampaignType.FIXED_POINTS
          ? "fixed_points"
          : "points_per_real"),
    startsAt: campaign.startsAt ?? campaign.campaignStartDate ?? null,
    endsAt: campaign.endsAt ?? campaign.campaignEndDate ?? null,
    observedAt: campaign.observedAt ?? campaign.lastVerifiedAt ?? null,
    isActive:
      campaign.isActive ?? resolvedCampaignStatus === CampaignStatus.ACTIVE,
  };
}

export class CampaignCatalogEngine {
  private readonly repository: CampaignCatalogRepository;
  private readonly providers: CampaignProvider[];

  constructor(
    repository: CampaignCatalogRepository,
    providers: CampaignProvider[],
  ) {
    this.repository = repository;
    this.providers = providers;
  }

  async syncOrganization(organizationId: number): Promise<CampaignRecord[]> {
    const syncedCampaigns: CampaignRecord[] = [];

    for (const provider of this.providers) {
      const fetchedCampaigns = await provider.fetchCampaigns();
      const normalizedCampaigns = provider
        .normalizeCampaigns(fetchedCampaigns)
        .map(normalizeCampaignRecord);
      const savedCampaigns = await this.repository.saveCampaigns(
        organizationId,
        normalizedCampaigns,
      );

      await this.repository.saveSnapshots(organizationId, savedCampaigns);
      syncedCampaigns.push(...savedCampaigns);
    }

    return syncedCampaigns;
  }
}
