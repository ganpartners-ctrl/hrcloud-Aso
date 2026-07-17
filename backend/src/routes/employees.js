// src/routes/employees.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { verifyToken, requireSameCompany } = require('../middleware/auth');

function dateOrNull(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (value === '') return null;
    return value;
  }
  return null;
}

const cols = `
  id, company_id, emp_no, name, preferred_name, gender, dob, nric, passport_no,
  nationality, email, work_email, phone, religion, race, marital_status,
  spouse_nric, spouse_name, children, pcb_children, spouse_relief,
  dept, grade, role, position, employment_type, join_date, confirm_date, resign_date,
  status, warnings, epf_no, socso_no, eis_no, tax_no, tax_branch,
  basic, allowance, travel, other, bonus, commission,
  epf_rate, epf_rate_er, hrdf_enabled, cp38_amount, cp38_date_from, cp38_date_to,
  pa_ins, medical_insurance,
  zakat_eligible, zakat_type, zakat_amount, zakat_rate, zakat_body, zakat_ref_no,
  permit_no, permit_exp, bank_name, bank_acc, bank_code,
  addr1, addr2, city, postcode, state, photo_url, notes,
  created_at, updated_at
`;

// GET /api/employees?companyId=CO001&status=Active&dept=Finance
router.get('/', verifyToken, async (req, res) => {
  const { companyId, status, dept, search } = req.query;
  const coId = companyId || req.user.companyId;
  if (!coId) return res.status(400).json({ error: 'companyId required' });
  try {
    let q = `SELECT ${cols} FROM employees WHERE company_id=$1`;
    const params = [coId];
    if (status)  { params.push(status); q += ` AND status=$${params.length}`; }
    if (dept)    { params.push(dept);   q += ` AND dept=$${params.length}`; }
    if (search)  { params.push(`%${search}%`); q += ` AND (name ILIKE $${params.length} OR emp_no ILIKE $${params.length})`; }
    q += ' ORDER BY emp_no';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/employees/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${cols} FROM employees WHERE id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/employees
router.post('/', verifyToken, async (req, res) => {
  const e = req.body;
  try {
    const { rows } = await pool.query(`
      INSERT INTO employees (
        id, company_id, emp_no, name, preferred_name, gender, dob, nric, passport_no,
        nationality, email, work_email, phone, religion, race, marital_status,
        spouse_nric, spouse_name, children, pcb_children, spouse_relief,
        dept, grade, role, position, employment_type, join_date, confirm_date,
        status, epf_no, socso_no, eis_no, tax_no, tax_branch,
        basic, allowance, travel, other, bonus, commission,
        epf_rate, epf_rate_er, hrdf_enabled, cp38_amount,
        pa_ins, medical_insurance,
        zakat_eligible, zakat_type, zakat_amount, zakat_rate, zakat_body, zakat_ref_no,
        bank_name, bank_acc, addr1, addr2, city, postcode, state, notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,
        $45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60
      ) RETURNING ${cols}`,
      [e.id, e.company_id||e.companyId, e.emp_no||e.empNo, e.name, e.preferred_name||e.preferredName,
       e.gender, dateOrNull(e.dob), e.nric, e.passport_no||e.passportNo,
       e.nationality||'Malaysian', e.email, e.work_email||e.workEmail, e.phone,
       e.religion, e.race, e.marital_status||e.maritalStatus||'Single',
       e.spouse_nric||e.spouseNric, e.spouse_name||e.spouseName,
       e.children||0, e.pcb_children||e.pcbChildren||0, e.spouse_relief||e.spouseRelief||false,
       e.dept, e.grade, e.role||'Staff', e.position, e.employment_type||e.employmentType||'Permanent',
       dateOrNull(e.join_date, e.joinDate), dateOrNull(e.confirm_date, e.confirmDate), e.status||'Active',
       e.epf_no||e.epfNo, e.socso_no||e.socsoNo, e.eis_no||e.eisNo, e.tax_no||e.taxNo, e.tax_branch||e.taxBranch,
       e.basic||0, e.allowance||0, e.travel||0, e.other||0, e.bonus||0, e.commission||0,
       e.epf_rate||e.epfRate||11, e.epf_rate_er||e.epfRateEr||13,
       e.hrdf_enabled!==undefined?e.hrdf_enabled:(e.hrdfEnabled!==false), e.cp38_amount||e.cp38Amount||0,
       e.pa_ins||e.paIns||0, e.medical_insurance||e.medicalInsurance||0,
       e.zakat_eligible||e.zakatEligible||false, e.zakat_type||e.zakatType||'amount',
       e.zakat_amount||e.zakatAmount||0, e.zakat_rate||e.zakatRate||0,
       e.zakat_body||e.zakatBody, e.zakat_ref_no||e.zakatRefNo,
       e.bank_name||e.bankName, e.bank_acc||e.bankAcc,
       e.addr1, e.addr2, e.city, e.postcode, e.state, e.notes]
    );
    res.status(201).json(rows[0]);
  } catch (e2) { res.status(500).json({ error: e2.message }); }
});

// PUT /api/employees/:id — full update
router.put('/:id', verifyToken, async (req, res) => {
  const e = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE employees SET
        name=$2, preferred_name=$3, gender=$4, dob=$5, nric=$6, passport_no=$7,
        nationality=$8, email=$9, work_email=$10, phone=$11, religion=$12, race=$13,
        marital_status=$14, spouse_nric=$15, spouse_name=$16, children=$17, pcb_children=$18,
        spouse_relief=$19, dept=$20, grade=$21, role=$22, position=$23,
        employment_type=$24, join_date=$25, confirm_date=$26, resign_date=$27, status=$28,
        epf_no=$29, socso_no=$30, eis_no=$31, tax_no=$32, tax_branch=$33,
        basic=$34, allowance=$35, travel=$36, other=$37, bonus=$38, commission=$39,
        epf_rate=$40, epf_rate_er=$41, hrdf_enabled=$42, cp38_amount=$43,
        pa_ins=$44, medical_insurance=$45,
        zakat_eligible=$46, zakat_type=$47, zakat_amount=$48, zakat_rate=$49,
        zakat_body=$50, zakat_ref_no=$51,
        bank_name=$52, bank_acc=$53, notes=$54,
        addr1=$55, addr2=$56, city=$57, postcode=$58, state=$59,
        cp38_date_from=$60, cp38_date_to=$61, updated_at=NOW()
      WHERE id=$1 RETURNING ${cols}`,
      [req.params.id,
       e.name, e.preferred_name||e.preferredName, e.gender, dateOrNull(e.dob), e.nric, e.passport_no||e.passportNo,
       e.nationality, e.email, e.work_email||e.workEmail, e.phone, e.religion, e.race,
       e.marital_status||e.maritalStatus, e.spouse_nric||e.spouseNric, e.spouse_name||e.spouseName,
       e.children, e.pcb_children||e.pcbChildren, e.spouse_relief||e.spouseRelief,
       e.dept, e.grade, e.role, e.position, e.employment_type||e.employmentType,
       dateOrNull(e.join_date, e.joinDate), dateOrNull(e.confirm_date, e.confirmDate), dateOrNull(e.resign_date, e.resignDate), e.status,
       e.epf_no||e.epfNo, e.socso_no||e.socsoNo, e.eis_no||e.eisNo, e.tax_no||e.taxNo, e.tax_branch||e.taxBranch,
       e.basic, e.allowance, e.travel, e.other, e.bonus, e.commission,
       e.epf_rate||e.epfRate, e.epf_rate_er||e.epfRateEr, e.hrdf_enabled??e.hrdfEnabled, e.cp38_amount||e.cp38Amount,
       e.pa_ins||e.paIns, e.medical_insurance||e.medicalInsurance,
       e.zakat_eligible||e.zakatEligible, e.zakat_type||e.zakatType, e.zakat_amount||e.zakatAmount,
       e.zakat_rate||e.zakatRate, e.zakat_body||e.zakatBody, e.zakat_ref_no||e.zakatRefNo,
       e.bank_name||e.bankName, e.bank_acc||e.bankAcc, e.notes,
       e.addr1, e.addr2, e.city, e.postcode, e.state,
       dateOrNull(e.cp38_date_from, e.cp38DateFrom), dateOrNull(e.cp38_date_to, e.cp38DateTo)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e2) { res.status(500).json({ error: e2.message }); }
});

// DELETE /api/employees/:id (terminate, not delete)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE employees SET status='Terminated', resign_date=CURRENT_DATE, updated_at=NOW() WHERE id=$1",
      [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
