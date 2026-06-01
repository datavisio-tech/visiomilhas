import { and, eq } from "drizzle-orm";
import { appDb } from "../../../../db/app/client";
import {
  campaign_snapshots,
  partner_campaigns,
} from "../../../../db/app/schema";
import type { CampaignRecord } from "../domain/types";
import type { CampaignCatalogRepository } from "../application/contracts";

function asTimestamp(value: string | Date | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function resolveCampaignTitle(campaign: CampaignRecord) {
  return (
    campaign.title ??
    campaign.campaignTitle ??
    campaign.partnerName ??
    campaign.partnerSlug ??
    campaign.campaignUrl ??
    "Campanha sem título"
  );
}

function buildSearchConditions(
  organizationId: number,
  campaign: CampaignRecord,
) {
  const url = campaign.campaignUrl ?? campaign.sourceUrl ?? null;

  if (url) {
    return and(
      eq(partner_campaigns.organizationId, organizationId),
      eq(partner_campaigns.campaignUrl, url),
    );
  }

  return and(
    eq(partner_campaigns.organizationId, organizationId),
    eq(partner_campaigns.partnerSlug, campaign.partnerSlug ?? ""),
    eq(partner_campaigns.campaignTitle, campaign.campaignTitle ?? ""),
  );
}

export function createCampaignCatalogRepository(): CampaignCatalogRepository {
  const db = appDb();

  return {
    async saveCampaigns(organizationId, campaigns) {
      const savedCampaigns: CampaignRecord[] = [];

      for (const campaign of campaigns) {
        const condition = buildSearchConditions(organizationId, campaign);
        const existingCampaign = await db
          .select({ id: partner_campaigns.id })
          .from(partner_campaigns)
          .where(condition)
          .limit(1);

        const values: any = {
          organizationId,
          partnerStoreId: campaign.partnerStoreId ?? null,
          programId: campaign.programId ?? null,
          programSlug: campaign.programSlug ?? null,
          programName: campaign.programName ?? null,
          partnerSlug: campaign.partnerSlug ?? null,
          partnerName: campaign.partnerName ?? null,
          logoUrl: campaign.logoUrl ?? null,
          campaignTitle: campaign.campaignTitle ?? campaign.title ?? null,
          campaignUrl: campaign.campaignUrl ?? campaign.sourceUrl ?? null,
          countryCode: campaign.countryCode ?? null,
          campaignType: campaign.campaignType ?? null,
          pointsPerReal: campaign.pointsPerReal ?? null,
          pointsPerDollar: campaign.pointsPerDollar ?? null,
          minimumPurchaseAmount: campaign.minimumPurchaseAmount ?? null,
          couponCode: campaign.couponCode ?? null,
          requiresClub: campaign.requiresClub ?? false,
          creditDeadlineDays: campaign.creditDeadlineDays ?? null,
          campaignStartDate: asTimestamp(campaign.campaignStartDate),
          campaignEndDate: asTimestamp(campaign.campaignEndDate),
          scrapedAt: asTimestamp(campaign.scrapedAt),
          lastVerifiedAt: asTimestamp(campaign.lastVerifiedAt),
          campaignStatus: campaign.campaignStatus ?? "UNKNOWN",
          sourceType: campaign.sourceType ?? null,
          sourceName: campaign.sourceName ?? null,
          isFeatured: campaign.isFeatured ?? false,
          title: resolveCampaignTitle(campaign),
          multiplier: campaign.multiplier ?? 0,
          multiplierType: campaign.multiplierType ?? "points_per_real",
          startsAt: asTimestamp(
            campaign.startsAt ?? campaign.campaignStartDate,
          ),
          endsAt: asTimestamp(campaign.endsAt ?? campaign.campaignEndDate),
          sourceUrl: campaign.sourceUrl ?? campaign.campaignUrl ?? null,
          observedAt: asTimestamp(
            campaign.observedAt ?? campaign.lastVerifiedAt,
          ),
          isActive: campaign.isActive ?? true,
          updatedAt: new Date(),
          createdAt: new Date(),
        };

        let campaignId = existingCampaign[0]?.id ?? null;

        if (campaignId) {
          await db
            .update(partner_campaigns)
            .set(values)
            .where(eq(partner_campaigns.id, campaignId));
        } else {
          const insertedCampaign = await db
            .insert(partner_campaigns)
            .values(values)
            .returning({ id: partner_campaigns.id });
          campaignId = insertedCampaign[0]?.id ?? null;
        }

        savedCampaigns.push({
          ...campaign,
          id: campaignId ?? undefined,
          organizationId,
        });
      }

      return savedCampaigns;
    },

    async saveSnapshots(_organizationId, campaigns) {
      const snapshotRows = campaigns
        .filter((campaign): campaign is CampaignRecord & { id: number } =>
          Boolean(campaign.id),
        )
        .map((campaign) => ({
          campaignId: campaign.id,
          pointsPerReal: campaign.pointsPerReal ?? null,
          campaignStatus: campaign.campaignStatus ?? "UNKNOWN",
          capturedAt: new Date(),
          rawPayload: campaign,
        }));

      if (!snapshotRows.length) {
        return;
      }

      await db.insert(campaign_snapshots).values(snapshotRows);
    },
  };
}

export default createCampaignCatalogRepository;
