import CAMPAIGNS from "./campaigns-seed.json";
import { appPool } from "../../db/app/client";

type SeedCampaign = {
  program_slug: string;
  program_name: string;
  partner_slug: string;
  partner_name: string;
  logo_url: string;
  campaign_title: string;
  campaign_url: string;
  country_code: string;
  campaign_type: string;
  points_per_real: number | null;
  points_per_dollar: number | null;
  minimum_purchase_amount: number | null;
  coupon_code: string | null;
  requires_club: boolean;
  credit_deadline_days: number | null;
  campaign_start_date: string | null;
  campaign_end_date: string | null;
  scraped_at: string | null;
  last_verified_at: string | null;
  campaign_status: string;
  source_type: string | null;
  source_name: string | null;
  is_featured: boolean;
};

function resolveMultiplier(campaign: SeedCampaign) {
  if (campaign.points_per_real !== null) {
    return {
      multiplier: campaign.points_per_real,
      multiplierType: "points_per_real",
    };
  }

  if (campaign.points_per_dollar !== null) {
    return {
      multiplier: campaign.points_per_dollar,
      multiplierType: "points_per_dollar",
    };
  }

  return { multiplier: 0, multiplierType: "fixed_points" };
}

export async function seedCampaigns(organizationId: number): Promise<void> {
  const pool = appPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const campaign of CAMPAIGNS as SeedCampaign[]) {
      const partnerStore = await client.query(
        `SELECT id FROM partner_stores WHERE organization_id = $1 AND slug = $2 LIMIT 1`,
        [organizationId, campaign.partner_slug],
      );

      const loyaltyProgram = await client.query(
        `SELECT id FROM loyalty_programs WHERE organization_id = $1 AND slug = $2 LIMIT 1`,
        [organizationId, campaign.program_slug],
      );

      const partnerStoreId = partnerStore.rows[0]?.id ?? null;
      const programId = loyaltyProgram.rows[0]?.id ?? null;
      const timestamp =
        campaign.last_verified_at ?? campaign.scraped_at ?? null;
      const multiplier = resolveMultiplier(campaign);

      const existing = await client.query(
        `SELECT id FROM partner_campaigns WHERE organization_id = $1 AND campaign_url = $2 LIMIT 1`,
        [organizationId, campaign.campaign_url],
      );

      if (existing.rows.length) {
        await client.query(
          `UPDATE partner_campaigns
           SET partner_store_id = $2,
               program_id = $3,
               program_slug = $4,
               program_name = $5,
               partner_slug = $6,
               partner_name = $7,
               logo_url = $8,
               campaign_title = $9,
               campaign_url = $10,
               country_code = $11,
               campaign_type = $12,
               points_per_real = $13,
               points_per_dollar = $14,
               minimum_purchase_amount = $15,
               coupon_code = $16,
               requires_club = $17,
               credit_deadline_days = $18,
               campaign_start_date = $19,
               campaign_end_date = $20,
               scraped_at = $21,
               last_verified_at = $22,
               campaign_status = $23,
               source_type = $24,
               source_name = $25,
               is_featured = $26,
               title = $9,
               multiplier = $27,
               multiplier_type = $28,
               starts_at = $19,
               ends_at = $20,
               source_url = $10,
               observed_at = $22,
               is_active = $29,
               updated_at = NOW()
           WHERE organization_id = $1 AND campaign_url = $10`,
          [
            organizationId,
            partnerStoreId,
            programId,
            campaign.program_slug,
            campaign.program_name,
            campaign.partner_slug,
            campaign.partner_name,
            campaign.logo_url,
            campaign.campaign_title,
            campaign.campaign_url,
            campaign.country_code,
            campaign.campaign_type,
            campaign.points_per_real,
            campaign.points_per_dollar,
            campaign.minimum_purchase_amount,
            campaign.coupon_code,
            campaign.requires_club,
            campaign.credit_deadline_days,
            campaign.campaign_start_date,
            campaign.campaign_end_date,
            campaign.scraped_at,
            timestamp,
            campaign.campaign_status,
            campaign.source_type,
            campaign.source_name,
            campaign.is_featured,
            multiplier.multiplier,
            multiplier.multiplierType,
            campaign.campaign_status === "ACTIVE",
          ],
        );
        continue;
      }

      await client.query(
        `INSERT INTO partner_campaigns (
          organization_id,
          partner_store_id,
          program_id,
          program_slug,
          program_name,
          partner_slug,
          partner_name,
          logo_url,
          campaign_title,
          campaign_url,
          country_code,
          campaign_type,
          points_per_real,
          points_per_dollar,
          minimum_purchase_amount,
          coupon_code,
          requires_club,
          credit_deadline_days,
          campaign_start_date,
          campaign_end_date,
          scraped_at,
          last_verified_at,
          campaign_status,
          source_type,
          source_name,
          is_featured,
          title,
          multiplier,
          multiplier_type,
          starts_at,
          ends_at,
          source_url,
          observed_at,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, NOW(), NOW()
        )`,
        [
          organizationId,
          partnerStoreId,
          programId,
          campaign.program_slug,
          campaign.program_name,
          campaign.partner_slug,
          campaign.partner_name,
          campaign.logo_url,
          campaign.campaign_title,
          campaign.campaign_url,
          campaign.country_code,
          campaign.campaign_type,
          campaign.points_per_real,
          campaign.points_per_dollar,
          campaign.minimum_purchase_amount,
          campaign.coupon_code,
          campaign.requires_club,
          campaign.credit_deadline_days,
          campaign.campaign_start_date,
          campaign.campaign_end_date,
          campaign.scraped_at,
          timestamp,
          campaign.campaign_status,
          campaign.source_type,
          campaign.source_name,
          campaign.is_featured,
          campaign.campaign_title,
          multiplier.multiplier,
          multiplier.multiplierType,
          campaign.campaign_start_date,
          campaign.campaign_end_date,
          campaign.campaign_url,
          timestamp,
          campaign.campaign_status === "ACTIVE",
        ],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default seedCampaigns;
