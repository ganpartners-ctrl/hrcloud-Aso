// scripts/reset.js — DROP all tables and re-run migrate + seed
require('dotenv').config();
const pool = require('../src/db/pool');

const TABLES = [
  'platform_sessions','notif_settings','company_groups','email_rules','email_settings',
  'billing_invoices','knowledge_base','ticket_replies','support_tickets','crm_records',
  'audit_log','approval_history','payroll_entries','payroll_batches',
  'leave_applications','payroll_config','leave_config','hr_config',
  'employees','licenses','license_tiers','platform_staff','companies'
];

async function reset() {
  if (process.env.NODE_ENV === 'production') {
    console.error('✗ Reset not allowed in production!');
    process.exit(1);
  }
  console.log('⚠  Resetting database (dev only)...');
  try {
    for (const t of TABLES) {
      await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
      console.log(`  dropped ${t}`);
    }
    await pool.query('DROP FUNCTION IF EXISTS trigger_set_updated_at CASCADE');
    console.log('✓ All tables dropped. Run `npm run setup` to rebuild.');
  } catch (e) {
    console.error('✗ Reset failed:', e.message);
  }
  await pool.end();
}

reset();
