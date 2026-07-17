// scripts/migrate.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function migrate() {
  console.log('▶ Running database migrations...');
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✓ Migration 001_init.sql applied successfully');
  } catch (e) {
    console.error('✗ Migration failed:', e.message);
    process.exit(1);
  }
  await pool.end();
}

migrate();
