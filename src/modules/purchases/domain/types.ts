export type PartnerStore = {
  id: number | null;
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PartnerCampaign = {
  id: number | null;
  partnerStoreId: number | null;
  programId: number | null;
  title: string;
  multiplier: number;
  multiplierType: "points_per_real" | "points_per_dollar" | string;
  startsAt?: string | null;
  endsAt?: string | null;
  sourceUrl?: string | null;
  observedAt?: string | null;
  isActive?: boolean;
};

export type PurchaseRecord = {
  id: number | null;
  organizationId: number | null;
  accountId: number | null;
  programId: number | null;
  partnerStoreId: number | null;
  partnerCampaignId?: number | null;
  title?: string | null;
  orderNumber?: string | null;
  purchaseDate?: string | null;
  purchaseAmountCents?: number | null;
  freightCents?: number | null;
  otherCostsCents?: number | null;
  expectedPoints?: number | null;
  creditedPoints?: number | null;
  multiplier?: number | null;
  status?: string | null;
  expectedCreditDate?: string | null;
  creditedAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PurchaseStatusHistory = {
  id?: number | null;
  purchaseId: number | null;
  oldStatus: string | null;
  newStatus: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type PurchaseEvidence = {
  id?: number | null;
  purchaseId: number | null;
  fileName?: string | null;
  fileType?: string | null;
  fileUrl?: string | null;
  uploadedAt?: string | null;
};
