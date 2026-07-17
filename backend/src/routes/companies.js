// src/routes/companies.js
const router = require('express').Router();
const pool   = require('../db/pool');
const bcrypt = require('bcryptjs');
const { verifyToken, requirePlatformAdmin } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, l.tier, l.status as lic_status, l.expiry, l.max_staff
       FROM companies c LEFT JOIN licenses l ON l.company_id=c.id ORDER BY c.name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requirePlatformAdmin, async (req, res) => {
  const c = req.body;
  const pinHash = c.superAdminPin ? await bcrypt.hash(c.superAdminPin, 10) : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO companies
        (id,name,trade_name,ssm_no,lhdn_no,epf_no,socso_no,eis_no,hrdf_no,
         phone,email,addr1,addr2,city,postcode,state,country,
         bank_name,bank_acc,payroll_cycle,pay_day,status,super_admin_id,super_admin_pin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, updated_at=NOW() RETURNING *`,
      [c.id, c.name, c.tradeName||c.trade_name, c.ssmNo||c.ssm_no, c.lhdnNo||c.lhdn_no,
       c.epfNo||c.epf_no, c.socsoNo||c.socso_no, c.eisNo||c.eis_no, c.hrdfNo||c.hrdf_no,
       c.phone, c.email, c.addr1, c.addr2, c.city, c.postcode, c.state, c.country||'Malaysia',
       c.bankName||c.bank_name, c.bankAcc||c.bank_acc,
       c.payrollCycle||c.payroll_cycle||'Monthly', c.payDay||c.pay_day,
       c.status||'Active', c.superAdminId||c.super_admin_id, pinHash]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const c = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE companies SET
        name=$2, trade_name=$3, ssm_no=$4, lhdn_no=$5, epf_no=$6, socso_no=$7,
        phone=$8, email=$9, addr1=$10, addr2=$11, city=$12, postcode=$13, state=$14,
        bank_name=$15, bank_acc=$16, status=$17, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, c.name, c.tradeName||c.trade_name, c.ssmNo||c.ssm_no, c.lhdnNo||c.lhdn_no,
       c.epfNo||c.epf_no, c.socsoNo||c.socso_no, c.phone, c.email,
       c.addr1, c.addr2, c.city, c.postcode, c.state,
       c.bankName||c.bank_name, c.bankAcc||c.bank_acc, c.status||'Active']);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
