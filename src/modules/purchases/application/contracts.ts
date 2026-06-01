/* eslint-disable no-unused-vars */
import type {
  PartnerStore,
  PartnerCampaign,
  PurchaseRecord,
  PurchaseEvidence,
  PurchaseStatusHistory,
} from "../domain/types";

export interface PartnerStoreRepository {
  list(organizationId: number): Promise<PartnerStore[]>;
  getById(id: number): Promise<PartnerStore | null>;
  create(payload: Partial<PartnerStore>): Promise<PartnerStore>;
}

export interface PartnerCampaignRepository {
  listByPartner(partnerId: number): Promise<PartnerCampaign[]>;
  getById(id: number): Promise<PartnerCampaign | null>;
}

export interface PurchaseRepository {
  list(organizationId: number, opts?: any): Promise<PurchaseRecord[]>;
  getById(id: number): Promise<PurchaseRecord | null>;
  create(payload: Partial<PurchaseRecord>): Promise<PurchaseRecord>;
  update(id: number, patch: Partial<PurchaseRecord>): Promise<PurchaseRecord>;
}

export interface PurchaseStatusRepository {
  list(purchaseId: number): Promise<PurchaseStatusHistory[]>;
  add(entry: Partial<PurchaseStatusHistory>): Promise<PurchaseStatusHistory>;
}

export interface PurchaseEvidenceRepository {
  add(evidence: Partial<PurchaseEvidence>): Promise<PurchaseEvidence>;
  listByPurchase(purchaseId: number): Promise<PurchaseEvidence[]>;
}
