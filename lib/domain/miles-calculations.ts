import { cents } from "../utils/money";
import { InsufficientMilesBalanceError } from "./miles-errors";

export function calculateCostPerThousandCents(
  points: number,
  totalCostCents: number,
): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  // CPM = (totalCost / points) * 1000
  const cpm = (totalCostCents / points) * 1000;
  return cents(cpm);
}

export function calculatePurchaseImpact(params: {
  currentBalance: number;
  currentCpmCents: number; // cost per 1000 in cents
  pointsBought: number;
  totalCostCents: number;
}) {
  const { currentBalance, currentCpmCents, pointsBought, totalCostCents } =
    params;
  const oldTotalCost = Math.round((currentBalance * currentCpmCents) / 1000);
  const newBalance = currentBalance + pointsBought;
  const newTotalCost = oldTotalCost + totalCostCents;
  const newCpm = calculateCostPerThousandCents(newBalance, newTotalCost);
  return {
    newBalance,
    newTotalCostCents: newTotalCost,
    newCpmCents: newCpm,
  };
}

export function calculateSaleImpact(params: {
  currentBalance: number;
  currentCpmCents: number;
  pointsSold: number;
  saleAmountCents: number;
}) {
  const { currentBalance, currentCpmCents, pointsSold, saleAmountCents } =
    params;
  if (pointsSold > currentBalance) {
    throw new InsufficientMilesBalanceError();
  }
  const costBase = Math.round((pointsSold * currentCpmCents) / 1000);
  const profitCents = saleAmountCents - costBase;
  const marginPercentage =
    saleAmountCents === 0
      ? 0
      : Math.round((profitCents / saleAmountCents) * 10000) / 100; // two decimals
  const newBalance = currentBalance - pointsSold;
  return {
    newBalance,
    costBaseCents: costBase,
    profitCents,
    marginPercentage,
  };
}

export function calculateTransferPointsIn(
  pointsSent: number,
  bonusPercent: number,
): number {
  if (pointsSent <= 0) return 0;
  if (!bonusPercent || bonusPercent <= 0) return Math.floor(pointsSent);
  const bonus = Math.floor((pointsSent * bonusPercent) / 100);
  return pointsSent + bonus;
}

export function calculateTransferImpact(params: {
  originBalance: number;
  destinationBalance: number;
  originCpmCents: number;
  destinationCpmCents: number;
  pointsSent: number;
  bonusPercent: number;
  feeCents: number;
}) {
  const {
    originBalance,
    destinationBalance,
    originCpmCents,
    destinationCpmCents,
    pointsSent,
    bonusPercent,
    feeCents,
  } = params;

  if (pointsSent > originBalance) throw new InsufficientMilesBalanceError();

  const pointsReceived = calculateTransferPointsIn(pointsSent, bonusPercent);

  // cost transferred is based on origin CPM
  const transferredCostBasis = Math.round((pointsSent * originCpmCents) / 1000);

  // destination existing total cost
  const destOldTotalCost = Math.round(
    (destinationBalance * destinationCpmCents) / 1000,
  );

  const destNewTotalCost =
    destOldTotalCost + transferredCostBasis + (feeCents || 0);
  const destNewBalance = destinationBalance + pointsReceived;
  const destNewCpm = calculateCostPerThousandCents(
    destNewBalance,
    destNewTotalCost,
  );

  return {
    newOriginBalance: originBalance - pointsSent,
    newDestinationBalance: destNewBalance,
    pointsReceived,
    transferredCostBasisCents: transferredCostBasis,
    feeCents: feeCents || 0,
    newDestinationCpmCents: destNewCpm,
    destinationTotalCostCents: destNewTotalCost,
  };
}

export function assertSufficientBalance(
  currentBalance: number,
  required: number,
) {
  if (required > currentBalance) throw new InsufficientMilesBalanceError();
  return true;
}

export function calculateBeneficiaryUsage(params: {
  limit: number;
  used: number;
  increment?: number;
}) {
  const { limit, used, increment = 0 } = params;
  const newUsed = used + increment;
  const percentUsed = limit > 0 ? (newUsed / limit) * 100 : 0;
  const exceeded = limit > 0 ? newUsed > limit : false;
  return { newUsed, percentUsed, exceeded };
}
