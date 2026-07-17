// src/routes/licenses.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken, requirePlatformAdmin } = require('../middleware/auth');

router.get('/',          verifyToken,            async (req, res) => {
  try { const {rows}=await pool.query('SELECT l.*,c.name as company_name FROM licenses l JOIN companies c ON c.id=l.company_id ORDER BY l.company_id'); res.json(rows); } catch(e){res.status(500).json({error:e.message})}});
router.get('/:companyId',verifyToken,            async (req, res) => {
  try { const {rows}=await pool.query('SELECT * FROM licenses WHERE company_id=$1',[req.params.companyId]); res.json(rows[0]||null); } catch(e){res.status(500).json({error:e.message})}});
router.post('/',         requirePlatformAdmin,   async (req, res) => {
  const l=req.body;
  try { const {rows}=await pool.query(`INSERT INTO licenses (company_id,tier,max_staff,status,expiry,key,issued_by,issued_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(company_id) DO UPDATE SET tier=EXCLUDED.tier,max_staff=EXCLUDED.max_staff,status=EXCLUDED.status,expiry=EXCLUDED.expiry,key=EXCLUDED.key,updated_at=NOW() RETURNING *`,[l.companyId||l.company_id,l.tier,l.maxStaff||l.max_staff,l.status||'Active',l.expiry,l.key,l.issuedBy||l.issued_by||'PA001',l.issuedOn||l.issued_on||new Date().toISOString().slice(0,10)]); res.json(rows[0]); } catch(e){res.status(500).json({error:e.message})}});
router.put('/:companyId',requirePlatformAdmin,   async (req, res) => {
  const l=req.body;
  try { const {rows}=await pool.query(`UPDATE licenses SET tier=$2,max_staff=$3,status=$4,expiry=$5,updated_at=NOW() WHERE company_id=$1 RETURNING *`,[req.params.companyId,l.tier,l.maxStaff||l.max_staff,l.status,l.expiry]); res.json(rows[0]); } catch(e){res.status(500).json({error:e.message})}});

module.exports = router;
