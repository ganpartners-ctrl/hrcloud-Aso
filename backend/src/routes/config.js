// src/routes/config.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

// ── HR Config ──────────────────────────────────────────────────────────
router.get('/hr/:companyId', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hr_config WHERE company_id=$1', [req.params.companyId]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/hr/:companyId', verifyToken, async (req, res) => {
  const c = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO hr_config (company_id, departments, grades, roles, employment_types, statuses)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (company_id) DO UPDATE SET
         departments=EXCLUDED.departments, grades=EXCLUDED.grades,
         roles=EXCLUDED.roles, employment_types=EXCLUDED.employment_types,
         statuses=EXCLUDED.statuses, updated_at=NOW() RETURNING *`,
      [req.params.companyId,
       JSON.stringify(c.departments||[]), JSON.stringify(c.grades||[]),
       JSON.stringify(c.roles||[]),       JSON.stringify(c.employmentTypes||c.employment_types||[]),
       JSON.stringify(c.statuses||[])]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Leave Config ────────────────────────────────────────────────────────
router.get('/leave/:companyId', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leave_config WHERE company_id=$1', [req.params.companyId]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/leave/:companyId', verifyToken, async (req, res) => {
  const c = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_config (company_id, leave_types, public_holidays, entitlements)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (company_id) DO UPDATE SET
         leave_types=EXCLUDED.leave_types, public_holidays=EXCLUDED.public_holidays,
         entitlements=EXCLUDED.entitlements, updated_at=NOW() RETURNING *`,
      [req.params.companyId,
       JSON.stringify(c.leaveTypes||c.leave_types||[]),
       JSON.stringify(c.publicHolidays||c.public_holidays||[]),
       JSON.stringify(c.entitlements||[])]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Payroll Config ──────────────────────────────────────────────────────
router.get('/payroll/:companyId', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payroll_config WHERE company_id=$1', [req.params.companyId]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/payroll/:companyId', verifyToken, async (req, res) => {
  const c = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO payroll_config (company_id, epf_ee_rate, epf_er_rate, socso_ceiling, eis_ceiling, cutoff_day, pay_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (company_id) DO UPDATE SET
         epf_ee_rate=EXCLUDED.epf_ee_rate, epf_er_rate=EXCLUDED.epf_er_rate,
         socso_ceiling=EXCLUDED.socso_ceiling, eis_ceiling=EXCLUDED.eis_ceiling,
         cutoff_day=EXCLUDED.cutoff_day, pay_day=EXCLUDED.pay_day, updated_at=NOW() RETURNING *`,
      [req.params.companyId, c.epfEeRate||c.epf_ee_rate||11, c.epfErRate||c.epf_er_rate||13,
       c.socsoCeiling||c.socso_ceiling||5000, c.eisCeiling||c.eis_ceiling||5000,
       c.cutoffDay||c.cutoff_day||25, c.payDay||c.pay_day||28]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
