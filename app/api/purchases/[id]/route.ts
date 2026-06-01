import { NextResponse } from "next/server";
import { createDrizzlePurchasesRepo } from "../../../../src/modules/purchases/infrastructure/drizzle-repo";
import { appPool } from "../../../../db/app/client";

const repo = createDrizzlePurchasesRepo();

export async function GET(req: Request, { params }: any) {
  try {
    const id = Number(params.id);
    const p = await repo.findById(id);
    const history = await repo.getStatusHistory(id);
    const evidences = await repo.listEvidences(id);

    // enrich with account/program display names
    if (p && p.accountId) {
      const client = await appPool().connect();
      try {
        const accRes = await client.query(
          `SELECT pa.id, pa.nickname, pa.holder_name, pa.current_points_balance, pa.program_id, lp.name as program_name
           FROM program_accounts pa
           LEFT JOIN loyalty_programs lp ON pa.program_id = lp.id
           WHERE pa.id = $1 LIMIT 1`,
          [p.accountId],
        );
        const acc = accRes.rows[0];
        if (acc) {
          const displayName =
            acc.nickname || acc.holder_name || `Conta ${acc.id}`;
          (p as any).accountName = displayName;
          (p as any).programId = Number(acc.program_id || p.programId || null);
          (p as any).programName =
            acc.program_name || (p as any).programName || null;
        }
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ ok: true, purchase: p, history, evidences });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: any) {
  try {
    const id = Number(params.id);
    await repo.deletePurchase(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}
