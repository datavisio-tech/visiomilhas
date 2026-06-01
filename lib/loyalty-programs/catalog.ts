import catalog from "../../data/loyalty-programs.json";
import type {
  LoyaltyProgramCatalogItem,
  LoyaltyProgramRecord,
  LoyaltyProgramType,
} from "./types";

const countryPriority: Record<string, number> = {
  BR: 0,
  PT: 1,
  US: 2,
  NL: 3,
  FR: 4,
  UK: 5,
  PA: 6,
};

const typePriority: Record<LoyaltyProgramType, number> = {
  REWARDS: 0,
  BANK: 1,
  CREDIT_CARD: 2,
  AIRLINE: 3,
  HOTEL: 4,
  CASHBACK: 5,
};

export function getLoyaltyProgramCatalog(): LoyaltyProgramCatalogItem[] {
  return [...catalog] as LoyaltyProgramCatalogItem[];
}

export function sortLoyaltyPrograms<
  T extends {
    countryCode: string;
    isFeatured?: boolean;
    programType: LoyaltyProgramType;
    name: string;
  },
>(programs: T[]) {
  return [...programs].sort((left, right) => {
    const countryScore =
      (countryPriority[left.countryCode] ?? 99) -
      (countryPriority[right.countryCode] ?? 99);
    if (countryScore !== 0) return countryScore;

    const featuredScore =
      Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
    if (featuredScore !== 0) return featuredScore;

    const typeScore =
      typePriority[left.programType] - typePriority[right.programType];
    if (typeScore !== 0) return typeScore;

    return left.name.localeCompare(right.name, "pt-BR");
  });
}

export function toCountryLabel(countryCode: string) {
  switch (countryCode) {
    case "BR":
      return "Brasil";
    case "PT":
      return "Portugal";
    case "US":
      return "Estados Unidos";
    case "NL":
      return "Holanda";
    case "FR":
      return "França";
    case "UK":
      return "Reino Unido";
    case "PA":
      return "Panamá";
    default:
      return countryCode;
  }
}

export function toProgramTypeLabel(programType: LoyaltyProgramType) {
  switch (programType) {
    case "AIRLINE":
      return "Rewards";
    case "BANK":
      return "Bank";
    case "HOTEL":
      return "Hotel";
    case "CREDIT_CARD":
      return "Cartão";
    case "REWARDS":
      return "Rewards";
    case "CASHBACK":
      return "Cashback";
    default:
      return programType;
  }
}

export function normalizeCatalogCatalogItem(
  item: LoyaltyProgramCatalogItem,
): LoyaltyProgramCatalogItem {
  return {
    ...item,
    is_featured: Boolean(item.is_featured),
  };
}

export function toProgramRecord(
  item: LoyaltyProgramCatalogItem,
  id: number,
  isActive = true,
): LoyaltyProgramRecord {
  return {
    id,
    slug: item.slug,
    name: item.name,
    shortName: item.short_name,
    countryCode: item.country_code,
    programType: item.program_type,
    description: item.description,
    icon: item.icon,
    brandColor: item.brand_color,
    isActive,
    isFeatured: Boolean(item.is_featured),
  };
}
