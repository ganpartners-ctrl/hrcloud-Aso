// src/db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

const sslDisabled = ['disable', 'false', '0', 'no'].includes(
  String(process.env.PGSSLMODE || process.env.DB_SSL || '').toLowerCase()
);
const sslEnabled = !sslDisabled && process.env.NODE_ENV === 'production';

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: sslEnabled ? { rejectUnauthorized: false } : false }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'hrcloud_malaysia',
        user:     process.env.DB_USER     || 'hrcloud',
        password: process.env.DB_PASS     || 'hrcloud_pass',
      }
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
