// src/routes/support.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  const { status, assignedTo } = req.query;
  try {
    let q = 'SELECT * FROM support_tickets'; const p = [];
    const conds = [];
    if (status)     { p.push(status);     conds.push(`status=$${p.length}`); }
    if (assignedTo) { p.push(assignedTo); conds.push(`assigned_to=$${p.length}`); }
    if (conds.length) q += ' WHERE '+conds.join(' AND ');
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const t = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO support_tickets (id,subject,description,company,email,status,priority,category,source,assigned_to,crm_lead_id,attach_name,attach_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [t.id||`TKT-${Date.now()}`, t.subject, t.description, t.company, t.email,
       t.status||'Open', t.priority||'Medium', t.category||'General', t.source||'Portal',
       t.assignedTo||t.assigned_to||null, t.crmLeadId||t.crm_lead_id||null,
       t.attachName||t.attach_name||null, t.attachData||t.attach_data||null]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const t = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE support_tickets SET status=$2, priority=$3, assigned_to=$4, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, t.status, t.priority, t.assignedTo||t.assigned_to]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Replies
router.get('/:id/replies', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ticket_replies WHERE ticket_id=$1 ORDER BY created_at', [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/replies', verifyToken, async (req, res) => {
  const { body, author, isInternal } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO ticket_replies (ticket_id,author,body,is_internal) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, author||req.user.name||req.user.id, body, isInternal||false]);
    // Update ticket timestamp
    await pool.query('UPDATE support_tickets SET updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
