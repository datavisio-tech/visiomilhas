import {
  registerPurchase,
  changePurchaseStatus,
  listPurchases,
} from "../application/services";
import createDrizzleMovementsRepo from "../../../../lib/repositories/movements.drizzle-repo";
import { appPool } from "../../../../db/app/client";

const movementsRepo = createDrizzleMovementsRepo();

// TESTE 17: create purchase -> APPROVED -> CREDITED -> validate movement
export async function TESTE_17_create_and_credit(
  organizationId: number,
  payload: any,
) {
  const ins = await registerPurchase({
    organizationId,
    ...payload,
    status: "PENDING_CREDIT",
  });
  // now transition to RECEIVED
  await changePurchaseStatus(ins.id, "RECEIVED", "auto credit test");
  // validate movement exists
  const entry = await movementsRepo.findEntryByRelatedEntity(
    "purchase_record",
    String(ins.id),
  );
  const pool = appPool();
  const client = await pool.connect();
  try {
    const lots = await client.query(
      `SELECT id, source_entry_id, acquired_points, remaining_points, status
       FROM mile_point_lots
       WHERE source_entry_id = $1`,
      [entry?.id ?? null],
    );
    const balance = await client.query(
      `SELECT current_points_balance
       FROM program_accounts
       WHERE id = $1`,
      [payload.accountId],
    );
    return {
      purchaseId: ins.id,
      movement: entry,
      lots: lots.rows,
      balance: Number(balance.rows[0]?.current_points_balance ?? 0),
    };
  } finally {
    client.release();
  }
}

// TESTE 18: open programs -> validate balance (this test returns the movement points so UI can assert)
export async function TESTE_18_validate_balance(
  organizationId: number,
  purchaseId: number,
) {
  const entry = await movementsRepo.findEntryByRelatedEntity(
    "purchase_record",
    String(purchaseId),
  );
  return { purchaseId, movement: entry };
}

// TESTE 19: validate timeline (returns status history + movements)
export async function TESTE_19_timeline(
  organizationId: number,
  purchaseId: number,
) {
  const p = await listPurchases(
    { organizationId, q: String(purchaseId) },
    1,
    0,
  );
  const entry = await movementsRepo.findEntryByRelatedEntity(
    "purchase_record",
    String(purchaseId),
  );
  return { purchase: p[0] ?? null, movement: entry };
}

// TESTE 20: re-run and ensure idempotency
export async function TESTE_20_idempotency(
  organizationId: number,
  payload: any,
) {
  const ins = await registerPurchase({
    organizationId,
    ...payload,
    status: "PENDING_CREDIT",
  });
  await changePurchaseStatus(ins.id, "RECEIVED", "first credit");
  const first = await movementsRepo.findEntryByRelatedEntity(
    "purchase_record",
    String(ins.id),
  );
  // re-run credit
  await changePurchaseStatus(ins.id, "RECEIVED", "second credit attempt");
  const second = await movementsRepo.findEntryByRelatedEntity(
    "purchase_record",
    String(ins.id),
  );
  const pool = appPool();
  const client = await pool.connect();
  try {
    const lots = await client.query(
      `SELECT count(*)::int AS cnt
       FROM mile_point_lots
       WHERE source_entry_id = $1`,
      [first?.id ?? null],
    );
    const balance = await client.query(
      `SELECT current_points_balance
       FROM program_accounts
       WHERE id = $1`,
      [payload.accountId],
    );
    return {
      purchaseId: ins.id,
      firstId: first?.id ?? null,
      secondId: second?.id ?? null,
      lotCount: Number(lots.rows[0]?.cnt ?? 0),
      balance: Number(balance.rows[0]?.current_points_balance ?? 0),
    };
  } finally {
    client.release();
  }
}

const _exports = {
  TESTE_17_create_and_credit,
  TESTE_18_validate_balance,
  TESTE_19_timeline,
  TESTE_20_idempotency,
};

export default _exports;
