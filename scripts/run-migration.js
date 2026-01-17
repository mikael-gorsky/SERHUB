const { Client } = require('pg');
const fs = require('fs');

// Supabase connection details
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const connectionString = process.argv[2];

if (!connectionString) {
  console.log('Usage: node run-migration.js <database-url>');
  console.log('');
  console.log('Get your database URL from Supabase Dashboard:');
  console.log('Project Settings > Database > Connection string > URI');
  console.log('');
  console.log('Or run the SQL directly in Supabase Dashboard > SQL Editor');
  console.log('File: scripts/add-org-modules.sql');
  process.exit(1);
}

async function runMigration() {
  console.log('Reading migration file...');
  const sql = fs.readFileSync('./scripts/add-org-modules.sql', 'utf8');

  console.log('Connecting to database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected successfully');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
