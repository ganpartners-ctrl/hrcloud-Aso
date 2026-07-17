// Import one company and its staff/salary master data from CSV files.
//
// Usage:
//   node scripts/import_company_staff_csv.js --company path/to/company.csv --staff path/to/staff.csv
//
// The script is idempotent for company and employees: same IDs are updated.
// Dates must be DD-MM-YYYY or YYYY-MM-DD in input; they are saved as YYYY-MM-DD.
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : '';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((v) => String(v).trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((v) => String(v).trim() !== '')) rows.push(row);

  const headers = (rows.shift() || []).map((h) => h.trim());
  return rows.map((values) => {
    const item = {};
    headers.forEach((h, i) => { item[h] = (values[i] || '').trim(); });
    return item;
  });
}

function readCsv(file) {
  if (!file) return [];
  return parseCsv(fs.readFileSync(path.resolve(file), 'utf8'));
}

function pick(row, names, fallback = '') {
  for (const name of names) {
    if (row[name] !== undefined && String(row[name]).trim() !== '') return String(row[name]).trim();
  }
  return fallback;
}

function money(row, names, fallback = 0) {
  const raw = pick(row, names, '');
  if (!raw) return fallback;
  const num = Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(num) ? num : fallback;
}

function bool(row, names, fallback = false) {
  const raw = pick(row, names, '');
  if (!raw) return fallback;
  return /^(true|yes|y|1)$/i.test(raw);
}

function sqlDate(row, names) {
  const raw = pick(row, names, '');
  if (!raw) return null;
  const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  throw new Error(`Invalid date "${raw}". Use DD-MM-YYYY or YYYY-MM-DD.`);
}

async function upsertCompany(client, row) {
  const id = pick(row, ['Company ID', 'company_id', 'id'], 'CO001');
  const superAdminPin = pick(row, ['Super Admin Password', 'super_admin_pin', 'superAdminPin'], 'Admin@2025');
  const pinHash = superAdminPin ? await bcrypt.hash(superAdminPin, 10) : null;
  const licenseTier = pick(row, ['License Tier', 'license_tier', 'tier'], 'growth');
  const maxStaff = Number(pick(row, ['Max Staff', 'max_staff'], licenseTier === 'starter' ? '10' : '25'));
  const expiry = sqlDate(row, ['License Expiry', 'license_expiry', 'expiry']) || '2027-12-31';

  await client.query(
    `INSERT INTO companies
      (id,name,trade_name,ssm_no,lhdn_no,epf_no,socso_no,eis_no,hrdf_no,phone,email,
       addr1,addr2,city,postcode,state,country,bank_name,bank_acc,payroll_cycle,pay_day,status,
       super_admin_id,super_admin_pin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name, trade_name=EXCLUDED.trade_name, ssm_no=EXCLUDED.ssm_no,
       lhdn_no=EXCLUDED.lhdn_no, epf_no=EXCLUDED.epf_no, socso_no=EXCLUDED.socso_no,
       eis_no=EXCLUDED.eis_no, hrdf_no=EXCLUDED.hrdf_no, phone=EXCLUDED.phone, email=EXCLUDED.email,
       addr1=EXCLUDED.addr1, addr2=EXCLUDED.addr2, city=EXCLUDED.city, postcode=EXCLUDED.postcode,
       state=EXCLUDED.state, country=EXCLUDED.country, bank_name=EXCLUDED.bank_name,
       bank_acc=EXCLUDED.bank_acc, payroll_cycle=EXCLUDED.payroll_cycle, pay_day=EXCLUDED.pay_day,
       status=EXCLUDED.status, super_admin_id=EXCLUDED.super_admin_id,
       super_admin_pin=COALESCE(EXCLUDED.super_admin_pin, companies.super_admin_pin),
       updated_at=NOW()`,
    [
      id,
      pick(row, ['Company Name', 'name']),
      pick(row, ['Trade Name', 'trade_name']),
      pick(row, ['SSM No', 'ssm_no']),
      pick(row, ['LHDN No', 'lhdn_no']),
      pick(row, ['EPF No', 'epf_no']),
      pick(row, ['SOCSO No', 'socso_no']),
      pick(row, ['EIS No', 'eis_no']),
      pick(row, ['HRDF No', 'hrdf_no']),
      pick(row, ['Phone', 'phone']),
      pick(row, ['Email', 'email']),
      pick(row, ['Address 1', 'addr1', 'Address']),
      pick(row, ['Address 2', 'addr2']),
      pick(row, ['City', 'city']),
      pick(row, ['Postcode', 'postcode']),
      pick(row, ['State', 'state']),
      pick(row, ['Country', 'country'], 'Malaysia'),
      pick(row, ['Bank Name', 'bank_name']),
      pick(row, ['Bank Account', 'bank_acc']),
      pick(row, ['Payroll Cycle', 'payroll_cycle'], 'Monthly'),
      pick(row, ['Pay Day', 'pay_day'], '28'),
      pick(row, ['Status', 'status'], 'Active'),
      pick(row, ['Super Admin ID', 'super_admin_id', 'superAdminId'], `SA${id.replace(/\D/g, '').padStart(3, '0')}`),
      pinHash
    ]
  );

  await client.query(
    `INSERT INTO licenses (company_id,tier,max_staff,status,expiry,key,issued_by,issued_on)
     VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE)
     ON CONFLICT (company_id) DO UPDATE SET
       tier=EXCLUDED.tier, max_staff=EXCLUDED.max_staff, status=EXCLUDED.status,
       expiry=EXCLUDED.expiry, key=EXCLUDED.key, updated_at=NOW()`,
    [
      id,
      licenseTier,
      maxStaff,
      pick(row, ['License Status', 'license_status'], 'Active'),
      expiry,
      pick(row, ['License Key', 'license_key'], `HRCLOUD-${id}-${new Date().getFullYear()}`),
      pick(row, ['Issued By', 'issued_by'], 'PA001')
    ]
  );

  return id;
}

async function upsertEmployee(client, row, fallbackCompanyId) {
  const employeeId = pick(row, ['Employee ID', 'employee_id', 'id']);
  if (!employeeId) throw new Error('Staff row missing Employee ID.');

  await client.query(
    `INSERT INTO employees (
      id, company_id, emp_no, name, preferred_name, gender, dob, nric, passport_no, nationality,
      email, work_email, phone, religion, race, marital_status, spouse_nric, spouse_name,
      children, pcb_children, spouse_relief, dept, grade, role, position, employment_type,
      join_date, confirm_date, status, epf_no, socso_no, eis_no, tax_no, tax_branch,
      basic, allowance, travel, other, bonus, commission, epf_rate, epf_rate_er,
      hrdf_enabled, cp38_amount, pa_ins, medical_insurance, zakat_eligible, zakat_type,
      zakat_amount, zakat_rate, zakat_body, zakat_ref_no, bank_name, bank_acc,
      addr1, addr2, city, postcode, state, notes
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
      $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60
    )
    ON CONFLICT (id) DO UPDATE SET
      company_id=EXCLUDED.company_id, emp_no=EXCLUDED.emp_no, name=EXCLUDED.name,
      preferred_name=EXCLUDED.preferred_name, gender=EXCLUDED.gender, dob=EXCLUDED.dob,
      nric=EXCLUDED.nric, passport_no=EXCLUDED.passport_no, nationality=EXCLUDED.nationality,
      email=EXCLUDED.email, work_email=EXCLUDED.work_email, phone=EXCLUDED.phone,
      religion=EXCLUDED.religion, race=EXCLUDED.race, marital_status=EXCLUDED.marital_status,
      spouse_nric=EXCLUDED.spouse_nric, spouse_name=EXCLUDED.spouse_name,
      children=EXCLUDED.children, pcb_children=EXCLUDED.pcb_children,
      spouse_relief=EXCLUDED.spouse_relief, dept=EXCLUDED.dept, grade=EXCLUDED.grade,
      role=EXCLUDED.role, position=EXCLUDED.position, employment_type=EXCLUDED.employment_type,
      join_date=EXCLUDED.join_date, confirm_date=EXCLUDED.confirm_date, status=EXCLUDED.status,
      epf_no=EXCLUDED.epf_no, socso_no=EXCLUDED.socso_no, eis_no=EXCLUDED.eis_no,
      tax_no=EXCLUDED.tax_no, tax_branch=EXCLUDED.tax_branch, basic=EXCLUDED.basic,
      allowance=EXCLUDED.allowance, travel=EXCLUDED.travel, other=EXCLUDED.other,
      bonus=EXCLUDED.bonus, commission=EXCLUDED.commission, epf_rate=EXCLUDED.epf_rate,
      epf_rate_er=EXCLUDED.epf_rate_er, hrdf_enabled=EXCLUDED.hrdf_enabled,
      cp38_amount=EXCLUDED.cp38_amount, pa_ins=EXCLUDED.pa_ins,
      medical_insurance=EXCLUDED.medical_insurance, zakat_eligible=EXCLUDED.zakat_eligible,
      zakat_type=EXCLUDED.zakat_type, zakat_amount=EXCLUDED.zakat_amount,
      zakat_rate=EXCLUDED.zakat_rate, zakat_body=EXCLUDED.zakat_body,
      zakat_ref_no=EXCLUDED.zakat_ref_no, bank_name=EXCLUDED.bank_name,
      bank_acc=EXCLUDED.bank_acc, addr1=EXCLUDED.addr1, addr2=EXCLUDED.addr2,
      city=EXCLUDED.city, postcode=EXCLUDED.postcode, state=EXCLUDED.state,
      notes=EXCLUDED.notes, updated_at=NOW()`,
    [
      employeeId,
      pick(row, ['Company ID', 'company_id'], fallbackCompanyId),
      pick(row, ['Employee No', 'emp_no', 'empNo'], employeeId),
      pick(row, ['Full Name', 'Name', 'name']),
      pick(row, ['Preferred Name', 'preferred_name', 'preferredName']),
      pick(row, ['Gender', 'gender']),
      sqlDate(row, ['DOB', 'Date of Birth', 'dob']),
      pick(row, ['NRIC', 'nric']),
      pick(row, ['Passport No', 'passport_no']),
      pick(row, ['Nationality', 'nationality'], 'Malaysian'),
      pick(row, ['Email', 'email']),
      pick(row, ['Work Email', 'work_email']),
      pick(row, ['Phone', 'phone']),
      pick(row, ['Religion', 'religion']),
      pick(row, ['Race', 'race']),
      pick(row, ['Marital Status', 'marital_status'], 'Single'),
      pick(row, ['Spouse NRIC', 'spouse_nric']),
      pick(row, ['Spouse Name', 'spouse_name']),
      Number(pick(row, ['Children', 'children'], '0')),
      Number(pick(row, ['PCB Children', 'pcb_children'], '0')),
      bool(row, ['Spouse Relief', 'spouse_relief'], false),
      pick(row, ['Department', 'dept']),
      pick(row, ['Grade', 'grade']),
      pick(row, ['Role', 'role'], 'Staff'),
      pick(row, ['Position', 'position']),
      pick(row, ['Employment Type', 'employment_type'], 'Permanent'),
      sqlDate(row, ['Join Date', 'join_date']),
      sqlDate(row, ['Confirm Date', 'confirm_date']),
      pick(row, ['Status', 'status'], 'Active'),
      pick(row, ['EPF No', 'epf_no']),
      pick(row, ['SOCSO No', 'socso_no']),
      pick(row, ['EIS No', 'eis_no']),
      pick(row, ['Tax No', 'tax_no']),
      pick(row, ['Tax Branch', 'tax_branch']),
      money(row, ['Basic Salary', 'basic', 'basic_salary']),
      money(row, ['Allowance', 'allowance']),
      money(row, ['Travel', 'travel']),
      money(row, ['Other', 'other']),
      money(row, ['Bonus', 'bonus']),
      money(row, ['Commission', 'commission']),
      money(row, ['EPF EE Rate', 'epf_rate'], 11),
      money(row, ['EPF ER Rate', 'epf_rate_er'], 13),
      bool(row, ['HRDF Enabled', 'hrdf_enabled'], true),
      money(row, ['CP38 Amount', 'cp38_amount']),
      money(row, ['PA Insurance', 'pa_ins']),
      money(row, ['Medical Insurance', 'medical_insurance']),
      bool(row, ['Zakat Eligible', 'zakat_eligible'], false),
      pick(row, ['Zakat Type', 'zakat_type'], 'amount'),
      money(row, ['Zakat Amount', 'zakat_amount']),
      money(row, ['Zakat Rate', 'zakat_rate']),
      pick(row, ['Zakat Body', 'zakat_body']),
      pick(row, ['Zakat Ref No', 'zakat_ref_no']),
      pick(row, ['Bank Name', 'bank_name']),
      pick(row, ['Bank Account', 'bank_acc']),
      pick(row, ['Address 1', 'addr1']),
      pick(row, ['Address 2', 'addr2']),
      pick(row, ['City', 'city']),
      pick(row, ['Postcode', 'postcode']),
      pick(row, ['State', 'state']),
      pick(row, ['Notes', 'notes'])
    ]
  );
}

async function main() {
  const companyRows = readCsv(argValue('--company'));
  const staffRows = readCsv(argValue('--staff'));
  if (!companyRows.length && !staffRows.length) {
    throw new Error('Provide --company and/or --staff CSV file.');
  }

  const client = await pool.connect();
  let defaultCompanyId = '';
  try {
    await client.query('BEGIN');
    for (const row of companyRows) {
      defaultCompanyId = await upsertCompany(client, row);
    }
    for (const row of staffRows) {
      await upsertEmployee(client, row, defaultCompanyId || pick(row, ['Company ID', 'company_id']));
    }
    await client.query('COMMIT');
    console.log(`Imported ${companyRows.length} company row(s) and ${staffRows.length} staff row(s).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
