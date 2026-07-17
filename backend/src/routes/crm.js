// src/routes/crm.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  const { type } = req.query;
  try {
    let q = 'SELECT * FROM crm_records'; const p = [];
    if (type) { p.push(type); q += ' WHERE type=$1'; }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { type, data } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO crm_records (type,data) VALUES ($1,$2) RETURNING *',
      [type, JSON.stringify(data)]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE crm_records SET data=$2, updated_at=NOW() WHERE id=$1 RETURNING *',
      [req.params.id, JSON.stringify(req.body.data||req.body)]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await pool.query('DELETE FROM crm_records WHERE id=$1', [req.params.id]); res.json({success:true}); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
