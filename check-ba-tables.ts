import { Client } from 'pg';

async function checkBetterAuthTables() {
  const client = new Client({
    host: '72.60.143.197',
    port: 5432,
    user: 'postgres',
    password: 'datavisiopostgres123',
    database: 'controle_adm_saas_datavisio',
  });

  try {
    await client.connect();

    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'ba_%'
    `;

    const result = await client.query(query);
    console.log('Better Auth tables in controle_adm_saas_datavisio:');
    if (result.rows.length === 0) {
      console.log('  ❌ NO TABLES FOUND');
    } else {
      result.rows.forEach(row => console.log('  ✅', row.table_name));
    }
  } finally {
    await client.end();
  }
}

checkBetterAuthTables().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
