import { appPool } from "../../db/app/client";

export async function seedSamplePurchases(
  organizationId: number,
): Promise<void> {
  const pool = appPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // pick one account and one partner for sample
    const accRow = await client.query(
      `SELECT id FROM program_accounts WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );
    const storeRow = await client.query(
      `SELECT id FROM partner_stores WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );
    const campaignRow = await client.query(
      `SELECT id FROM partner_campaigns WHERE organization_id = $1 LIMIT 1`,
      [organizationId],
    );

    if (!accRow.rows.length || !storeRow.rows.length) {
      await client.query("ROLLBACK");
      return;
    }

    const accountId = accRow.rows[0].id;
    const partnerStoreId = storeRow.rows[0].id;
    const partnerCampaignId = campaignRow.rows.length
      ? campaignRow.rows[0].id
      : null;

    // Insert a few sample purchases idempotently
    const samples = [
      {
        orderNumber: `SAMPLE-ORD-1001`,
        title: "Compra exemplo - tênis",
        purchaseAmountCents: 19900,
        expectedPoints: 199,
        multiplier: 1,
        status: "REGISTERED",
      },
      {
        orderNumber: `SAMPLE-ORD-1002`,
        title: "Compra exemplo - livro",
        purchaseAmountCents: 5900,
        expectedPoints: 59,
        multiplier: 1,
        status: "TRACKED",
      },
      {
        orderNumber: `SAMPLE-ORD-1003`,
        title: "Compra exemplo - monitor",
        purchaseAmountCents: 129900,
        expectedPoints: 1299,
        multiplier: 1,
        status: "PENDING_CREDIT",
      },
    ];

    for (const s of samples) {
      const check = await client.query(
        `SELECT id FROM purchase_records WHERE order_number = $1 AND organization_id = $2 LIMIT 1`,
        [s.orderNumber, organizationId],
      );
      if (!check.rows.length) {
        const res = await client.query(
          `INSERT INTO purchase_records (organization_id, account_id, program_id, partner_store_id, partner_campaign_id, title, order_number, purchase_date, purchase_amount_cents, expected_points, multiplier, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, NOW(), NOW()) RETURNING id`,
          [
            organizationId,
            accountId,
            null,
            partnerStoreId,
            partnerCampaignId,
            s.title,
            s.orderNumber,
            s.purchaseAmountCents,
            s.expectedPoints,
            s.multiplier,
            s.status,
          ],
        );
        const id = res.rows[0].id;
        // add a mocked evidence
        await client.query(
          `INSERT INTO purchase_evidences (purchase_id, file_name, file_type, file_url, uploaded_at) VALUES ($1, $2, $3, $4, NOW())`,
          [
            id,
            `${s.orderNumber}-evidence.jpg`,
            "image/jpeg",
            `https://example.com/evidence/${s.orderNumber}.jpg`,
          ],
        );
        // initial status history
        await client.query(
          `INSERT INTO purchase_status_history (purchase_id, old_status, new_status, notes, created_at) VALUES ($1, $2, $3, $4, NOW())`,
          [id, null, s.status, "seed import"],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default seedSamplePurchases;
