export type LoyaltyProgramType =
  | "AIRLINE"
  | "BANK"
  | "HOTEL"
  | "CREDIT_CARD"
  | "REWARDS"
  | "CASHBACK";

export type LoyaltyProgramCatalogItem = {
  slug: string;
  name: string;
  short_name: string;
  country_code: string;
  program_type: LoyaltyProgramType;
  description: string;
  icon: string;
  brand_color: string;
  is_featured?: boolean;
};

export type LoyaltyProgramRecord = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  countryCode: string;
  programType: LoyaltyProgramType;
  description: string;
  icon: string;
  brandColor: string;
  isActive: boolean;
  isFeatured: boolean;
};
