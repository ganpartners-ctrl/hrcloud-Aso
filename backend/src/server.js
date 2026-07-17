// src/server.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '*').split(','),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));  // large for base64 attachments
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many login attempts' }));
app.use('/api',      rateLimit({ windowMs: 60 * 1000, max: 500 }));

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/companies',  require('./routes/companies'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/payroll',    require('./routes/payroll'));
app.use('/api/leaves',     require('./routes/leaves'));
app.use('/api/config',     require('./routes/config'));
app.use('/api/licenses',   require('./routes/licenses'));
app.use('/api/billing',    require('./routes/billing'));
app.use('/api/crm',        require('./routes/crm'));
app.use('/api/support',    require('./routes/support'));
app.use('/api/audit',      require('./routes/audit'));
app.use('/api/groups',     require('./routes/groups'));
app.use('/api/email',      require('./routes/email'));
app.use('/api/platform',   require('./routes/platform'));

// ── Health check ────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const pool = require('./db/pool');
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: e.message });
  }
});

// ── 404 / Error handlers ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`HRCloud API running on http://localhost:${PORT}`));
module.exports = app;
