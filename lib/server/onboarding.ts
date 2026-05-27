import { admPool } from "../../db/adm/client";

export type OnboardingState =
  | "missing-session"
  | "not-started"
  | "partial"
  | "ready";

export type OnboardingProvisionResult = {
  organizationId: number;
  programId?: number;
  accountId?: number;
  status: "created" | "recovered" | "already-provisioned";
};

export async function ensureGlobalUser(
  email: string | null | undefined,
  name?: string | null | undefined,
  image?: string | null | undefined,
): Promise<number | null> {
  if (!email) return null;

  const pool = admPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id FROM global_users WHERE email = $1 LIMIT 1`,
      [email.trim()],
    );

    if (res.rows.length > 0) {
      return Number(res.rows[0].id);
    }

    const insert = await client.query(
      `INSERT INTO global_users (name, email, image, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [name ?? email, email.trim(), image ?? null],
    );

    return Number(insert.rows[0].id);
  } finally {
    client.release();
  }
}

export async function isUserOnboardedByEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;

  const pool = admPool();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id FROM global_users WHERE email = $1 LIMIT 1`,
      [email.trim()],
    );

    if (res.rows.length === 0) return false;

    const globalUserId = Number(res.rows[0].id);

    const org = await client.query(
      `SELECT id FROM organizations WHERE owner_user_id = $1 LIMIT 1`,
      [globalUserId],
    );

    return org.rows.length > 0;
  } finally {
    client.release();
  }
}

export async function getOnboardingStateByEmail(
  email: string | null | undefined,
): Promise<OnboardingState> {
  if (!email) return "missing-session";

  const pool = admPool();
  const client = await pool.connect();
  try {
    const hasTable = async (tableName: string) => {
      const result = await client.query(
        `SELECT to_regclass($1) IS NOT NULL AS exists`,
        [tableName],
      );

      return Boolean(result.rows[0]?.exists);
    };

    const userRes = await client.query(
      `SELECT id FROM global_users WHERE email = $1 LIMIT 1`,
      [email.trim()],
    );

    if (userRes.rows.length === 0) return "not-started";

    const globalUserId = Number(userRes.rows[0].id);
    const orgRes = await client.query(
      `SELECT id FROM organizations WHERE owner_user_id = $1 LIMIT 1`,
      [globalUserId],
    );

    if (orgRes.rows.length === 0) return "partial";

    const organizationId = Number(orgRes.rows[0].id);
    const hasProgramsTable = await hasTable("loyalty_programs");
    const hasAccountsTable = await hasTable("program_accounts");

    if (!hasProgramsTable || !hasAccountsTable) {
      return "partial";
    }

    const programRes = await client.query(
      `SELECT id FROM loyalty_programs WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );

    const accountRes =
      programRes.rows.length > 0
        ? await client.query(
            `SELECT id FROM program_accounts WHERE organization_id = $1 AND program_id = $2 LIMIT 1`,
            [organizationId, Number(programRes.rows[0].id)],
          )
        : { rows: [] as Array<{ id: unknown }> };

    if (programRes.rows.length > 0 && accountRes.rows.length > 0)
      return "ready";

    return "partial";
  } finally {
    client.release();
  }
}

export async function ensureInitialOrganizationAndAccount(
  globalUserId: number,
  email: string | null | undefined,
): Promise<OnboardingProvisionResult | null> {
  if (!globalUserId) return null;

  const adm = admPool();
  const admClient = await adm.connect();

  let organizationId: number | null = null;
  let createdOrganization = false;

  try {
    const orgRes = await admClient.query(
      `SELECT id FROM organizations WHERE owner_user_id = $1 LIMIT 1`,
      [globalUserId],
    );

    if (orgRes.rows.length > 0) {
      organizationId = Number(orgRes.rows[0].id);
    } else {
      const name = (email ?? "").split("@")[0] || `user-${globalUserId}`;
      const slugBase = name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const slug = `${slugBase}-${globalUserId}`;

      try {
        const insert = await admClient.query(
          `INSERT INTO organizations (name, slug, owner_user_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [name, slug, globalUserId, "active"],
        );

        organizationId = Number(insert.rows[0].id);
        createdOrganization = true;
      } catch {
        const retry = await admClient.query(
          `SELECT id FROM organizations WHERE owner_user_id = $1 LIMIT 1`,
          [globalUserId],
        );

        if (retry.rows.length > 0) {
          organizationId = Number(retry.rows[0].id);
        }
      }
    }
  } finally {
    admClient.release();
  }

  if (!organizationId) return null;

  // Ensure app-level default program and account
  const { appPool } = await import("../../db/app/client");
  const app = appPool();
  const appClient = await app.connect();

  let createdProgram = false;
  let createdAccount = false;

  try {
    // Ensure a default program exists for this organization
    const programRes = await appClient.query(
      `SELECT id FROM loyalty_programs WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );

    let programId: number | null = null;
    if (programRes.rows.length > 0) {
      programId = Number(programRes.rows[0].id);
    } else {
      const insertProgram = await appClient.query(
        `INSERT INTO loyalty_programs (organization_id, name, slug, type, is_system_default, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [
          organizationId,
          "Default Program",
          "default-program",
          "default",
          true,
          true,
        ],
      );
      programId = Number(insertProgram.rows[0].id);
      createdProgram = true;
    }

    // Ensure a program account exists for this organization+program
    const accRes = await appClient.query(
      `SELECT id FROM program_accounts WHERE organization_id = $1 AND program_id = $2 LIMIT 1`,
      [organizationId, programId],
    );

    let accountId: number | null = null;
    if (accRes.rows.length > 0) {
      accountId = Number(accRes.rows[0].id);
    } else {
      const holderName = (email ?? "").split("@")[0] || `user-${globalUserId}`;
      const insertAcc = await appClient.query(
        `INSERT INTO program_accounts (organization_id, program_id, nickname, holder_name, current_points_balance, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [organizationId, programId, "Minha conta", holderName, 0, "active"],
      );
      accountId = Number(insertAcc.rows[0].id);
      createdAccount = true;
    }

    return {
      organizationId,
      programId: programId ?? undefined,
      accountId: accountId ?? undefined,
      status: createdOrganization
        ? "created"
        : createdProgram || createdAccount
          ? "recovered"
          : "already-provisioned",
    };
  } finally {
    appClient.release();
  }
}
