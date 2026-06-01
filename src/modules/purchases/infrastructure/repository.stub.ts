/* eslint-disable no-unused-vars */
/* Minimal repository stubs to implement later. These are placeholders so
  the application layer can import contracts during the foundation phase. */
import type {
  PartnerStore,
  PartnerCampaign,
  PurchaseRecord,
  PurchaseStatusHistory,
  PurchaseEvidence,
} from "../domain/types";

export const PartnerStoreRepositoryStub = {
  async list(_organizationId: number): Promise<PartnerStore[]> {
    return [];
  },
  async getById(_id: number) {
    return null;
  },
  async create(payload: Partial<PartnerStore>) {
    return {
      id: null,
      slug: payload.slug || "",
      name: payload.name || "",
      logoUrl: payload.logoUrl || null,
    } as PartnerStore;
  },
};

export const PurchaseRepositoryStub = {
  async list(_organizationId: number) {
    return [] as PurchaseRecord[];
  },
  async getById(_id: number) {
    return null;
  },
  async create(payload: Partial<PurchaseRecord>) {
    return {
      id: null,
      organizationId: payload.organizationId ?? null,
      accountId: payload.accountId ?? null,
      programId: payload.programId ?? null,
      partnerStoreId: payload.partnerStoreId ?? null,
    } as PurchaseRecord;
  },
  async update(_id: number, patch: Partial<PurchaseRecord>) {
    return { id: _id, ...patch } as PurchaseRecord;
  },
};
