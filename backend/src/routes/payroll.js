// src/routes/payroll.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

// GET batches
router.get('/batches', verifyToken, async (req, res) => {
  const coId = req.user.role === 'platform_admin' ? (req.query.companyId || req.user.companyId) : req.user.companyId;
  if (!coId) return res.status(400).json({ error: 'companyId required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM payroll_batches WHERE company_id=$1 ORDER BY month DESC', [coId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create batch
router.post('/batches', verifyToken, async (req, res) => {
  const b = req.body;
  const companyId = req.user.role === 'platform_admin' ? (b.company_id||b.companyId) : req.user.companyId;
  if (!companyId) return res.status(400).json({ error: 'companyId required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO payroll_batches (id,company_id,period,month,working_days,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE
       SET status=EXCLUDED.status, updated_at=NOW() RETURNING *`,
      [b.id, companyId, b.period, b.month, b.working_days||b.workingDays||26,
       b.status||'Draft', b.created_by||b.createdBy||req.user.name]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update batch status
router.put('/batches/:id/status', verifyToken, async (req, res) => {
  const { status, note, actor } = req.body;
  const ts = new Date().toISOString();
  const actorName = actor || req.user.name || req.user.id;
  const colMap = {
    'Submitted': `submitted_by=$2, submitted_at=$3`,
    'Approved':  `approved_by=$2, approved_at=$3, approval_note=$4`,
    'Rejected':  `rejected_by=$2, rejected_at=$3, approval_note=$4`,
    'Confirmed': `confirmed_by=$2, confirmed_at=$3`,
    'Paid':      `paid_by=$2, paid_at=$3`,
  };
  try {
    const setStr = colMap[status]
      ? `status=$1, ${colMap[status].replace('$3','$4').replace('$2','$3').replace('$1','$2')}, updated_at=NOW()`
      : 'status=$1, updated_at=NOW()';
    let q, params;
    const companyClause = req.user.role === 'platform_admin' ? '' : ` AND company_id=$${note ? 6 : 3}`;
    if (note) {
      q = `UPDATE payroll_batches SET status=$2,${colMap[status]||''}, updated_at=NOW() WHERE id=$1${companyClause} RETURNING *`;
      params = [req.params.id, status, actorName, ts, note].concat(req.user.role === 'platform_admin' ? [] : [req.user.companyId]);
    } else {
      q = `UPDATE payroll_batches SET status=$2, updated_at=NOW() WHERE id=$1${companyClause} RETURNING *`;
      params = [req.params.id, status].concat(req.user.role === 'platform_admin' ? [] : [req.user.companyId]);
    }
    const { rows } = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ error: 'Payroll batch not found' });
    // Approval history
    await pool.query(
      `INSERT INTO approval_history (company_id,batch_id,action,status,actor,note)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.companyId, req.params.id, status.toUpperCase(), status, actorName, note||null]);
    res.json(rows[0]||{});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET payroll entries
router.get('/entries', verifyToken, async (req, res) => {
  const { batchId, companyId } = req.query;
  const coId = req.user.role === 'platform_admin' ? (companyId || req.user.companyId) : req.user.companyId;
  if (!coId) return res.status(400).json({ error: 'companyId required' });
  try {
    let q = 'SELECT * FROM payroll_entries WHERE company_id=$1';
    const params = [coId];
    if (batchId) { params.push(batchId); q += ` AND batch_id=$${params.length}`; }
    q += ' ORDER BY created_at';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upsert entry
router.post('/entries', verifyToken, async (req, res) => {
  const e = req.body;
  const companyId = req.user.role === 'platform_admin' ? (e.companyId||e.company_id) : req.user.companyId;
  if (!companyId) return res.status(400).json({ error: 'companyId required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO payroll_entries (batch_id,employee_id,company_id,type,label,amount,is_recurring,note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (batch_id,employee_id,type,label) DO UPDATE
       SET amount=EXCLUDED.amount, note=EXCLUDED.note RETURNING *`,
      [e.batchId||e.batch_id, e.employeeId||e.employee_id, companyId,
       e.type, e.label, e.amount, e.isRecurring||e.is_recurring||false, e.note||null]);
    res.json(rows[0]);
  } catch (e2) { res.status(500).json({ error: e2.message }); }
});

// DELETE entry
router.delete('/entries/:id', verifyToken, async (req, res) => {
  try {
    const params = req.user.role === 'platform_admin' ? [req.params.id] : [req.params.id, req.user.companyId];
    await pool.query('DELETE FROM payroll_entries WHERE id=$1' + (req.user.role === 'platform_admin' ? '' : ' AND company_id=$2'), params);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
