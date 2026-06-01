import createDrizzlePurchasesRepo from "../infrastructure/drizzle-repo";
import { createStateMachine } from "../domain/state-machine";
import createDrizzleMovementsRepo from "../../../../lib/repositories/movements.drizzle-repo";
import { appDb } from "../../../../db/app/client";

function getPurchasesRepo() {
  return createDrizzlePurchasesRepo();
}

export async function registerPurchase(p: any) {
  // basic validation
  if (!p.organizationId) throw new Error("organizationId required");
  const repo = getPurchasesRepo();
  const insert = await repo.insertPurchase(p);
  // add initial history
  await repo.updateStatus(insert.id, null, p.status ?? "REGISTERED", "initial");
  return insert;
}

export async function changePurchaseStatus(
  purchaseId: number,
  newStatus: string,
  notes?: string,
) {
  return appDb().transaction(async (tx: any) => {
    const purchaseRepo = createDrizzlePurchasesRepo(tx);
    const txMovementsRepo = createDrizzleMovementsRepo(tx);

    const existing: any = await purchaseRepo.findById(purchaseId);
    if (!existing) throw new Error("purchase not found");
    const sm = createStateMachine(existing.status);
    if (!sm.canTransitionTo(newStatus)) {
      throw new Error(
        `invalid status transition ${existing.status} -> ${newStatus}`,
      );
    }

    const accountId = Number(existing.accountId ?? 0);
    const points =
      Number(existing.creditedPoints ?? 0) > 0
        ? Number(existing.creditedPoints)
        : Number(existing.expectedPoints ?? 0);

    if (newStatus === "RECEIVED") {
      const existingEntry = await txMovementsRepo.findEntryByRelatedEntity(
        "purchase_record",
        String(purchaseId),
      );
      const reversalEntry = await txMovementsRepo.findEntryByRelatedEntity(
        "purchase_record",
        String(purchaseId) + ":reversal",
      );

      if (!existingEntry) {
        if (!accountId) {
          throw new Error(
            "purchase account is required for RECEIVED accounting",
          );
        }
        if (points <= 0) {
          throw new Error(
            "purchase points are required for RECEIVED accounting",
          );
        }

        const entry = await txMovementsRepo.insertEntry({
          organizationId: existing.organizationId,
          programId: existing.programId ?? undefined,
          accountId,
          type: "PURCHASE_BONUS",
          category: "purchase",
          direction: "in",
          points,
          amountCents: existing.purchaseAmountCents ?? undefined,
          occurredAt: existing.receivedAt ?? existing.creditedAt ?? new Date(),
          description: `Purchase bonus ${existing.orderNumber || purchaseId}`,
          source: "PURCHASE",
          status: "posted",
          relatedEntityType: "purchase_record",
          relatedEntityId: String(purchaseId),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        await txMovementsRepo.insertLot({
          organizationId: existing.organizationId,
          programId: existing.programId ?? undefined,
          accountId,
          sourceEntryId: entry.id,
          acquiredPoints: points,
          remainingPoints: points,
          totalCostCents: existing.purchaseAmountCents ?? undefined,
          issuedAt: existing.receivedAt ?? existing.creditedAt ?? new Date(),
          status: "available",
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            source: "purchase_bonus",
            purchaseId,
          },
        } as any);

        await txMovementsRepo.updateProgramAccountBalance(accountId, points);
      } else if (existing.status === "PROBLEM" && reversalEntry) {
        if (!accountId) {
          throw new Error(
            "purchase account is required for RECEIVED accounting",
          );
        }
        if (points <= 0) {
          throw new Error(
            "purchase points are required for RECEIVED accounting",
          );
        }

        await txMovementsRepo.markEntryRestored(existingEntry.id);
        await txMovementsRepo.markEntryReversed(
          reversalEntry.id,
          existingEntry.id,
        );
        await txMovementsRepo.reopenLotsBySourceEntryId(existingEntry.id);
        await txMovementsRepo.updateProgramAccountBalance(accountId, points);
      }
    }

    if (
      existing.status === "RECEIVED" &&
      (newStatus === "PROBLEM" || newStatus === "APPROVED")
    ) {
      const original = await txMovementsRepo.findEntryByRelatedEntity(
        "purchase_record",
        String(purchaseId),
      );
      if (original) {
        const reversalExists = await txMovementsRepo.findEntryByRelatedEntity(
          "purchase_record",
          String(purchaseId) + ":reversal",
        );
        if (!reversalExists) {
          if (!accountId) {
            throw new Error(
              "purchase account is required for reversal accounting",
            );
          }

          const reversalPoints =
            Number(original.points ?? 0) > 0 ? Number(original.points) : points;
          if (reversalPoints <= 0) {
            throw new Error(
              "purchase points are required for reversal accounting",
            );
          }
          const rev = await txMovementsRepo.insertEntry({
            organizationId: existing.organizationId,
            programId: existing.programId ?? undefined,
            accountId,
            type: "PURCHASE_REVERSAL",
            category: "purchase",
            direction: "out",
            points: reversalPoints,
            amountCents: existing.purchaseAmountCents ?? undefined,
            occurredAt: new Date(),
            description: `Reversal for purchase ${existing.orderNumber || purchaseId}`,
            source: "PURCHASE",
            status: "posted",
            relatedEntityType: "purchase_record",
            relatedEntityId: String(purchaseId) + ":reversal",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);

          await txMovementsRepo.markEntryReversed(original.id, rev.id);
          await txMovementsRepo.closeLotsBySourceEntryId(original.id);
          await txMovementsRepo.updateProgramAccountBalance(
            accountId,
            -reversalPoints,
          );
        }
      }
    }

    await purchaseRepo.updateStatus(
      purchaseId,
      existing.status,
      newStatus,
      notes,
    );
    return { id: purchaseId, status: newStatus };
  });
}

export async function attachEvidence(purchaseId: number, evidence: any) {
  // store minimal evidence record (mocked upload elsewhere)
  const repo = getPurchasesRepo();
  const inserted = await repo.insertEvidence(purchaseId, evidence);
  return inserted;
}

export async function fetchDashboardKPIs(organizationId: number) {
  const repo = getPurchasesRepo();
  const rows = await repo.kpiCountsByStatus(organizationId);
  // normalize
  const map: Record<string, number> = {};
  (rows as any[]).forEach((r) => {
    map[r.status] = Number(r.count ?? 0);
  });
  return map;
}

export async function listPurchases(filters: any = {}, limit = 50, offset = 0) {
  const repo = getPurchasesRepo();
  return repo.listPurchases(filters, limit, offset);
}
