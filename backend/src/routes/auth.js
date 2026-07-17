// src/routes/auth.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const pool     = require('../db/pool');
const { signToken, verifyToken } = require('../middleware/auth');

// ── Platform Admin login ────────────────────────────────────────────────
router.post('/platform', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'ID and password required' });
  try {
    // Platform admin — check env vars first (legacy), then DB
    if (id === process.env.PLATFORM_ADMIN_ID && password === process.env.PLATFORM_ADMIN_PASS) {
      return res.json({ token: signToken({ id, role: 'platform_admin' }), role: 'platform_admin' });
    }
    const { rows } = await pool.query('SELECT * FROM platform_staff WHERE id=$1 AND is_active=true', [id]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const staff = rows[0];
    const ok = await bcrypt.compare(password, staff.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: staff.id, role: staff.role, name: staff.name, permissions: staff.permissions });
    res.json({ token, staff: { id: staff.id, name: staff.name, role: staff.role, permissions: staff.permissions } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Company Super Admin login ────────────────────────────────────────────
router.post('/superadmin', async (req, res) => {
  const { id, password, companyId } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'ID and password required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM companies WHERE super_admin_id=$1', [id]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const co = rows[0];
    if (companyId && co.id !== companyId) return res.status(401).json({ error: 'Company mismatch' });
    const ok = await bcrypt.compare(password, co.super_admin_pin);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id, role: 'super_admin', companyId: co.id, companyName: co.name });
    // Log audit
    await pool.query(
      "INSERT INTO audit_log (actor,action,target,detail,severity,module) VALUES ($1,$2,$3,$4,'info','auth')",
      [id, 'SUPER_ADMIN_LOGIN', co.name, 'Login successful']);
    res.json({ token, role: 'super_admin', company: { id: co.id, name: co.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Employee login ────────────────────────────────────────────────────────
router.post('/employee', async (req, res) => {
  const { id, password, companyId } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'ID and password required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM employees WHERE id=$1 AND company_id=$2', [id, companyId]);
    if (!rows.length) return res.status(401).json({ error: 'Employee not found' });
    const emp = rows[0];
    if (emp.status === 'Terminated') return res.status(401).json({ error: 'Account is terminated' });
    // Password = last 6 digits of NRIC
    const nric = (emp.nric || '').replace(/[^0-9]/g, '');
    const expected = nric.length >= 6 ? nric.slice(-6) : nric;
    if (password !== expected) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({
      id: emp.id, role: emp.role, companyId: emp.company_id,
      name: emp.name, empNo: emp.emp_no, dept: emp.dept
    });
    res.json({
      token,
      employee: {
        id: emp.id, empNo: emp.emp_no, name: emp.name, preferredName: emp.preferred_name,
        role: emp.role, dept: emp.dept, grade: emp.grade, companyId: emp.company_id,
        status: emp.status, photo_url: emp.photo_url
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Refresh token ─────────────────────────────────────────────────────────
router.post('/refresh', verifyToken, (req, res) => {
  const { iat, exp, ...payload } = req.user;
  res.json({ token: signToken(payload) });
});

// ── Get current user ─────────────────────────────────────────────────────
router.get('/me', verifyToken, (req, res) => res.json(req.user));

module.exports = router;
