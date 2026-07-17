// src/db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

const pgSsl =
  process.env.PGSSL === 'true'
    ? { rejectUnauthorized: false }
    : process.env.PGSSL === 'false'
      ? false
      : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: pgSsl }
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
