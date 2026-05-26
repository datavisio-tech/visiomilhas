import { appPool } from "../../db/app/client";
import {
  AuthContextError,
  buildOwnershipContext,
  type AuthContext,
  type OwnershipContext,
} from "./auth-context";

type OwnershipRow = {
  id: number;
  organization_id: number;
  created_by_user_id?: number | null;
};

type OwnershipResolution = {
  ownership: OwnershipContext;
  ownershipSource: "user" | "organization";
};

function isRowsOwnedByUser(authUserId: string, row: OwnershipRow): boolean {
  const createdByUserId = row.created_by_user_id;

  if (createdByUserId === null || createdByUserId === undefined) {
    return false;
  }

  return String(createdByUserId).trim() === authUserId;
}

async function resolveRow(
  tableName: string,
  id: number,
): Promise<OwnershipRow | null> {
  const pool = appPool();
  const client = await pool.connect();

  try {
    try {
      const result = await client.query(
        `SELECT id, organization_id, created_by_user_id FROM ${tableName} WHERE id = $1 LIMIT 1`,
        [id],
      );

      return (result.rows[0] as OwnershipRow | undefined) ?? null;
    } catch (err: any) {
      // If the column created_by_user_id does not exist in the table (schema drift),
      // fallback to selecting only id and organization_id and treat created_by_user_id as null.
      // This avoids hard failures when running against older schemas.
      if (err && err.code === "42703" && String(err.message).includes("created_by_user_id")) {
        const fallback = await client.query(
          `SELECT id, organization_id FROM ${tableName} WHERE id = $1 LIMIT 1`,
          [id],
        );

        const row = fallback.rows[0];
        if (!row) return null;
        return {
          id: row.id,
          organization_id: row.organization_id,
          created_by_user_id: null,
        } as OwnershipRow;
      }

      throw err;
    }
  } finally {
    client.release();
  }
}

async function resolveOwnershipForRow(
  auth: AuthContext,
  tableName: string,
  id: number,
  notFoundMessage: string,
): Promise<OwnershipResolution> {
  const row = await resolveRow(tableName, id);

  if (!row) {
    throw new AuthContextError(notFoundMessage, "INVALID_CONTEXT", 400);
  }

  const ownershipSource = isRowsOwnedByUser(auth.userId, row)
    ? "user"
    : "organization";

  if (
    row.created_by_user_id !== null &&
    row.created_by_user_id !== undefined &&
    ownershipSource !== "user"
  ) {
    throw new AuthContextError("Ownership required", "FORBIDDEN", 403);
  }

  return {
    ownership: buildOwnershipContext({
      userId: auth.userId,
      accountId: row.id,
      organizationId: row.organization_id,
      ownsAccount: true,
      ownsOrganizationScope: ownershipSource === "organization",
    }),
    ownershipSource,
  };
}

export async function resolveOwnedAccount(
  auth: AuthContext,
  accountId: number,
): Promise<OwnershipResolution> {
  return resolveOwnershipForRow(
    auth,
    "program_accounts",
    accountId,
    "Account not found",
  );
}

export async function resolveOwnedPurchase(
  auth: AuthContext,
  purchaseId: number,
): Promise<OwnershipResolution> {
  return resolveOwnershipForRow(
    auth,
    "mile_purchases",
    purchaseId,
    "Purchase not found",
  );
}

export async function resolveOwnedSale(
  auth: AuthContext,
  saleId: number,
): Promise<OwnershipResolution> {
  return resolveOwnershipForRow(auth, "mile_sales", saleId, "Sale not found");
}

export async function resolveOwnedTransfer(
  auth: AuthContext,
  transferId: number,
): Promise<OwnershipResolution> {
  return resolveOwnershipForRow(
    auth,
    "mile_transfers",
    transferId,
    "Transfer not found",
  );
}
