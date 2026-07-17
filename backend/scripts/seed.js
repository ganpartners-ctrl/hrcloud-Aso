// scripts/seed.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function seed() {
  console.log('▶ Seeding demo data...');
  const sql = fs.readFileSync(path.join(__dirname, '../seeds/seed_demo.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✓ Demo seed applied successfully');
    console.log('');
    console.log('  Demo accounts created:');
    console.log('  ─────────────────────────────────────────────');
    console.log('  Platform Admin  PA001  /  HRCLOUD2025');
    console.log('  Super Admin CO001  SA001  /  Admin@TC2025');
    console.log('  Super Admin CO002  SA002  /  Admin@TCL2025');
    console.log('  Employee E001  /  141234 (last 6 of NRIC)');
    console.log('  Employee E002  /  105678');
    console.log('  Employee E003  /  113456');
    console.log('  Employee E004  /  147890');
    console.log('  Employee E005  /  042345');
    console.log('  ─────────────────────────────────────────────');
  } catch (e) {
    console.error('✗ Seed failed:', e.message);
    process.exit(1);
  }
  await pool.end();
}

seed();
