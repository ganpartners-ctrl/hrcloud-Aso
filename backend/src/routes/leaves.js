// src/routes/leaves.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  const coId = req.user.role === 'platform_admin'
    ? (req.query.companyId || req.user.companyId)
    : req.user.companyId;
  const empId = req.query.employeeId;
  if (!coId) return res.status(400).json({ error: 'companyId required' });
  try {
    let q = 'SELECT * FROM leave_applications WHERE company_id=$1';
    const p = [coId];
    if (empId) { p.push(empId); q += ` AND employee_id=$${p.length}`; }
    q += ' ORDER BY from_date DESC';
    const { rows } = await pool.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const l = req.body;
  const companyId = req.user.role === 'platform_admin'
    ? (l.companyId || l.company_id)
    : req.user.companyId;
  if (!companyId) return res.status(400).json({ error: 'companyId required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_applications
        (id,company_id,employee_id,type,type_color,from_date,to_date,days,reason,status,submitted_on,doc_name,doc_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [l.id, companyId, l.employeeId||l.employee_id||req.user.id,
       l.type, l.typeColor||l.type_color, l.fromDate||l.from_date, l.toDate||l.to_date,
       l.days, l.reason, l.status||'Pending', l.submittedOn||l.submitted_on||new Date().toISOString().slice(0,10),
       l.docName||l.doc_name||null, l.docData||l.doc_data||null]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/approve', verifyToken, async (req, res) => {
  const { approvedBy, note } = req.body;
  const coId = req.user.companyId;
  try {
    const params = req.user.role === 'platform_admin'
      ? [req.params.id, approvedBy||req.user.name]
      : [req.params.id, approvedBy||req.user.name, coId];
    const { rows } = await pool.query(
      `UPDATE leave_applications SET status='Approved', approved_by=$2, approved_on=CURRENT_DATE, updated_at=NOW()
       WHERE id=$1${req.user.role === 'platform_admin' ? '' : ' AND company_id=$3'} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Leave application not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/reject', verifyToken, async (req, res) => {
  const { rejectedBy, reason } = req.body;
  const coId = req.user.companyId;
  try {
    const params = req.user.role === 'platform_admin'
      ? [req.params.id, rejectedBy||req.user.name, reason||null]
      : [req.params.id, rejectedBy||req.user.name, reason||null, coId];
    const { rows } = await pool.query(
      `UPDATE leave_applications SET status='Rejected', rejected_by=$2, rejected_on=CURRENT_DATE, reject_reason=$3, updated_at=NOW()
       WHERE id=$1${req.user.role === 'platform_admin' ? '' : ' AND company_id=$4'} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Leave application not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
