require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function main() {
  await pool.query('UPDATE companies SET super_admin_pin=$1 WHERE id=$2', [
    bcrypt.hashSync('Admin@TC2025', 10),
    'CO001'
  ]);
  await pool.query('UPDATE companies SET super_admin_pin=$1 WHERE id=$2', [
    bcrypt.hashSync('Admin@TCL2025', 10),
    'CO002'
  ]);
  await pool.query('UPDATE platform_staff SET password_hash=$1 WHERE id=$2', [
    bcrypt.hashSync('HRCLOUD2025', 10),
    'PA001'
  ]);
  await pool.end();
  console.log('Demo passwords fixed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
