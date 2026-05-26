const pg = require('pg');

async function checkBetterAuthTables() {
  const client = new pg.Client('postgres://postgres:datavisiopostgres123@72.60.143.197:5432/controle_adm_saas_datavisio');
  
  try {
    await client.connect();
    console.log('✓ Connected to controle_adm_saas_datavisio');
    
    // Check Better Auth tables
    const res = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (tablename LIKE 'ba_%' OR tablename LIKE 'verification%')
      ORDER BY tablename
    `);
    
    console.log('\nBetter Auth Tables:');
    if (res.rows.length === 0) {
      console.log('⚠ No Better Auth tables found');
    } else {
      res.rows.forEach(row => {
        console.log(`  ✓ ${row.tablename}`);
      });
    }
    
    // Count records in each table
    console.log('\nRecord Counts:');
    for (const row of res.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM ${row.tablename}`);
      const count = countRes.rows[0].count;
      console.log(`  ${row.tablename}: ${count} records`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBetterAuthTables();
