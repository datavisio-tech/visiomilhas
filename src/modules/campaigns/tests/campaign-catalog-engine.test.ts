import { describe, expect, it } from "vitest";
import { CampaignStatus, CampaignType } from "../domain/enums";
import { normalizeCampaignRecord } from "../application/services";

describe("normalizeCampaignRecord", () => {
  it("fills the campaign defaults used by the catalog engine", () => {
    const campaign = normalizeCampaignRecord({
      campaignTitle: "Livelo + Mercado Livre 8 pts por real",
      partnerName: "Mercado Livre",
      partnerSlug: "mercado-livre",
      programName: "Livelo",
      programSlug: "livelo",
      pointsPerReal: 8,
    });

    expect(campaign.campaignType).toBe(CampaignType.POINTS_PER_REAL);
    expect(campaign.campaignStatus).toBe(CampaignStatus.UNKNOWN);
    expect(campaign.title).toBe("Livelo + Mercado Livre 8 pts por real");
    expect(campaign.sourceName).toBe("campaigns-seed.json");
    expect(campaign.isActive).toBe(false);
  });
});
