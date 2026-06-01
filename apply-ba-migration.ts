import { Client } from 'pg';
import * as fs from 'fs';

async function applyMigration() {
  const client = new Client({
    host: '72.60.143.197',
    port: 5432,
    user: 'postgres',
    password: 'datavisiopostgres123',
    database: 'controle_adm_saas_datavisio',
  });

  try {
    await client.connect();
    console.log('✓ Connected to controle_adm_saas_datavisio');

    // First, check if tables already exist
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'ba_%'
    `;

    const checkResult = await client.query(checkQuery);
    const existingTableCount = parseInt(checkResult.rows[0].count);

    if (existingTableCount === 4) {
      console.log('✓ All 4 Better Auth tables already exist');
      return;
    }

    console.log(`ℹ Found ${existingTableCount}/4 Better Auth tables, applying migration...`);

    // Read migration file
    const migrationPath = 'db/adm/migrations/0001_better_auth_tables.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and filter empty statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`ℹ Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`  ✓ Statement ${i + 1}/${statements.length}`);
      } catch (err) {
        if (err instanceof Error && err.message.includes('already exists')) {
          console.log(`  ⚠ Statement ${i + 1}/${statements.length} - already exists (skipped)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✓ Migration applied successfully');

    // Verify all tables exist
    const verifyResult = await client.query(checkQuery);
    const finalTableCount = parseInt(verifyResult.rows[0].count);
    console.log(`✓ Final count: ${finalTableCount}/4 Better Auth tables`);

  } finally {
    await client.end();
  }
}

applyMigration().catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
