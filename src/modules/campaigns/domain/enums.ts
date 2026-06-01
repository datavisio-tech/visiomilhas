export const CampaignType = {
  POINTS_PER_REAL: "POINTS_PER_REAL",
  POINTS_PER_DOLLAR: "POINTS_PER_DOLLAR",
  FIXED_POINTS: "FIXED_POINTS",
  CASHBACK: "CASHBACK",
} as const;

export type CampaignTypeValue =
  (typeof CampaignType)[keyof typeof CampaignType];

export const CampaignStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
  UNKNOWN: "UNKNOWN",
} as const;

export type CampaignStatusValue =
  (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignTypeValue, string> = {
  POINTS_PER_REAL: "Pontos por real",
  POINTS_PER_DOLLAR: "Pontos por dólar",
  FIXED_POINTS: "Pontos fixos",
  CASHBACK: "Cashback",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatusValue, string> = {
  ACTIVE: "Ativa",
  EXPIRED: "Expirada",
  SUSPENDED: "Suspensa",
  UNKNOWN: "Desconhecida",
};
