import { describe, it, expect } from "vitest";
import {
  calculateCostPerThousandCents,
  calculatePurchaseImpact,
  calculateSaleImpact,
  calculateTransferPointsIn,
  calculateTransferImpact,
  assertSufficientBalance,
  calculateBeneficiaryUsage,
} from "../../lib/domain/miles-calculations";
import { InsufficientMilesBalanceError } from "../../lib/domain/miles-errors";

describe("miles-calculations domain", () => {
  it("calculateCostPerThousandCents - 10k for R$300 -> 3000 cents", () => {
    expect(calculateCostPerThousandCents(10000, 30000)).toBe(3000);
  });

  it("calculateCostPerThousandCents - 13k for R$300 -> ~2308 cents", () => {
    expect(calculateCostPerThousandCents(13000, 30000)).toBe(2308);
  });

  it("calculateCostPerThousandCents - zero points returns 0", () => {
    expect(calculateCostPerThousandCents(0, 10000)).toBe(0);
  });

  it("calculatePurchaseImpact - from zero balance", () => {
    const res = calculatePurchaseImpact({
      currentBalance: 0,
      currentCpmCents: 0,
      pointsBought: 10000,
      totalCostCents: 30000,
    });
    expect(res.newBalance).toBe(10000);
    expect(res.newTotalCostCents).toBe(30000);
    expect(res.newCpmCents).toBe(3000);
  });

  it("calculatePurchaseImpact - merge with existing balance", () => {
    const res = calculatePurchaseImpact({
      currentBalance: 10000,
      currentCpmCents: 3000,
      pointsBought: 10000,
      totalCostCents: 20000,
    });
    expect(res.newBalance).toBe(20000);
    expect(res.newTotalCostCents).toBe(50000);
    expect(res.newCpmCents).toBe(2500);
  });

  it("calculateSaleImpact - profit case", () => {
    const res = calculateSaleImpact({
      currentBalance: 10000,
      currentCpmCents: 3000,
      pointsSold: 5000,
      saleAmountCents: 25000,
    });
    expect(res.newBalance).toBe(5000);
    expect(res.costBaseCents).toBe(15000);
    expect(res.profitCents).toBe(10000);
    expect(res.marginPercentage).toBe(40);
  });

  it("calculateSaleImpact - insufficient balance throws", () => {
    expect(() =>
      calculateSaleImpact({
        currentBalance: 3000,
        currentCpmCents: 3000,
        pointsSold: 5000,
        saleAmountCents: 10000,
      }),
    ).toThrow(InsufficientMilesBalanceError);
  });

  it("calculateSaleImpact - breakeven", () => {
    const res = calculateSaleImpact({
      currentBalance: 10000,
      currentCpmCents: 3000,
      pointsSold: 5000,
      saleAmountCents: 15000,
    });
    expect(res.profitCents).toBe(0);
    expect(res.marginPercentage).toBe(0);
  });

  it("calculateTransferPointsIn - no bonus and with bonus", () => {
    expect(calculateTransferPointsIn(10000, 0)).toBe(10000);
    expect(calculateTransferPointsIn(10000, 30)).toBe(13000);
    expect(calculateTransferPointsIn(10000, 1)).toBe(10100);
  });

  it("calculateTransferImpact - basic bonus transfer", () => {
    const res = calculateTransferImpact({
      originBalance: 20000,
      destinationBalance: 0,
      originCpmCents: 3000,
      destinationCpmCents: 0,
      pointsSent: 10000,
      bonusPercent: 30,
      feeCents: 0,
    });
    expect(res.newOriginBalance).toBe(10000);
    expect(res.newDestinationBalance).toBe(13000);
    expect(res.pointsReceived).toBe(13000);
    expect(res.transferredCostBasisCents).toBe(30000);
    expect(res.destinationTotalCostCents).toBe(30000);
    expect(res.newDestinationCpmCents).toBe(2308);
  });

  it("calculateTransferImpact - with fee", () => {
    const res = calculateTransferImpact({
      originBalance: 20000,
      destinationBalance: 0,
      originCpmCents: 3000,
      destinationCpmCents: 0,
      pointsSent: 10000,
      bonusPercent: 30,
      feeCents: 5000,
    });
    expect(res.destinationTotalCostCents).toBe(35000);
    expect(res.newDestinationCpmCents).toBe(2692);
  });

  it("calculateTransferImpact - insufficient origin balance throws", () => {
    expect(() =>
      calculateTransferImpact({
        originBalance: 5000,
        destinationBalance: 0,
        originCpmCents: 3000,
        destinationCpmCents: 0,
        pointsSent: 10000,
        bonusPercent: 0,
        feeCents: 0,
      }),
    ).toThrow(InsufficientMilesBalanceError);
  });

  it("assertSufficientBalance works and throws", () => {
    expect(assertSufficientBalance(10000, 5000)).toBe(true);
    expect(assertSufficientBalance(5000, 5000)).toBe(true);
    expect(() => assertSufficientBalance(4000, 5000)).toThrow(
      InsufficientMilesBalanceError,
    );
  });

  it("calculateBeneficiaryUsage - usage checks", () => {
    const a = calculateBeneficiaryUsage({ limit: 25, used: 13, increment: 1 });
    expect(a.newUsed).toBe(14);
    expect(Math.round(a.percentUsed)).toBe(56);
    expect(a.exceeded).toBe(false);

    const b = calculateBeneficiaryUsage({ limit: 25, used: 25, increment: 1 });
    expect(b.exceeded).toBe(true);

    const c = calculateBeneficiaryUsage({ limit: 0, used: 0, increment: 1 });
    expect(c.percentUsed).toBe(0);
    expect(c.exceeded).toBe(false);
  });
});
