import { kpiCounts, purchasesFilterQuery } from "../infrastructure/queries";

export class PurchasesDashboardViewModel {
  organizationId: number;
  constructor(organizationId: number) {
    this.organizationId = organizationId;
  }

  async kpis() {
    return kpiCounts(this.organizationId);
  }

  async list(filters: any = {}, limit = 50, offset = 0) {
    const merged = { ...filters, organizationId: this.organizationId };
    return purchasesFilterQuery(merged, limit, offset);
  }
}
