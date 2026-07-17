// src/routes/audit.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken, requirePlatformAdmin } = require('../middleware/auth');

router.get('/', requirePlatformAdmin, async (req, res) => {
  const { limit=200, module: mod } = req.query;
  try {
    let q = 'SELECT * FROM audit_log'; const p = [];
    if (mod) { p.push(mod); q += ' WHERE module=$1'; }
    q += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)||200}`;
    const { rows } = await pool.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { actor, action, target, detail, severity='info', module: mod='system' } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO audit_log (actor,action,target,detail,severity,module,ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [actor||req.user?.id, action, target, detail, severity, mod, req.ip]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/', requirePlatformAdmin, async (req, res) => {
  try { await pool.query('TRUNCATE audit_log RESTART IDENTITY'); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
