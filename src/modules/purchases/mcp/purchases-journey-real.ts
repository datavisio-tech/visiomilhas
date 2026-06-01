import { listPurchases, fetchDashboardKPIs } from "../application/services";

export async function runPurchasesReadJourney(organizationId: number) {
  // Simple validation + sample read operations to exercise domain runtime
  const kpis = await fetchDashboardKPIs(organizationId);
  const recent = await listPurchases({ organizationId }, 20, 0);

  // Basic validations
  const validated = {
    totalStatuses: Object.keys(kpis).length,
    sampleCount: (recent || []).length,
  };

  return { kpis, recent, validated };
}

export default runPurchasesReadJourney;
