-- ============================================================
-- HRCloud Malaysia — Demo Seed Data
-- Run AFTER migration: psql -U hrcloud -d hrcloud_malaysia -f seed_demo.sql
-- ============================================================

BEGIN;

-- ── License Tiers ─────────────────────────────────────────────────────
INSERT INTO license_tiers (id, label, price, max_staff, color) VALUES
  ('starter',    'Starter',     99,    10,    '#4F6EF7'),
  ('growth',     'Growth',      299,   25,    '#059669'),
  ('business',   'Business',    699,   100,   '#7C3AED'),
  ('enterprise', 'Enterprise',  1499,  500,   '#DC2626'),
  ('unlimited',  'Unlimited',   2999,  99999, '#0EA5C9')
ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label, price=EXCLUDED.price;

-- ── Companies ─────────────────────────────────────────────────────────
INSERT INTO companies (
  id, name, trade_name, ssm_no, lhdn_no, epf_no, socso_no, eis_no, hrdf_no,
  phone, email, addr1, addr2, city, postcode, state, country,
  bank_name, bank_acc, payroll_cycle, pay_day, status,
  super_admin_id, super_admin_pin
) VALUES
(
  'CO001', 'TechCorp Sdn. Bhd.', 'TechCorp',
  '202001012345', 'C 1234567890', 'EP 1234567', 'SO 1234567', 'EI 1234567', 'H 1234567',
  '03-22345678', 'hr@techcorp.com.my',
  'Level 18, Menara TechCorp', 'Jalan Ampang', 'Kuala Lumpur', '50450', 'W.P. Kuala Lumpur', 'Malaysia',
  'Maybank', '1234567890', 'Monthly', 'Last Working Day', 'Active',
  'SA001', '$2a$10$yWFlBqq7Zv.aRgip3R0Y5.QFgqTduR1o6MBZFA0mRuETdHuJnFWwe'
  -- pin: Admin@TC2025
),
(
  'CO002', 'TechCorp Logistics Sdn. Bhd.', 'TC Logistics',
  '202101056789', 'C 9876543210', 'EP 7654321', 'SO 7654321', 'EI 7654321', 'H 7654321',
  '03-33456789', 'hr@tclogistics.com.my',
  'Lot 5, Jalan Industri 3', 'Kawasan Perindustrian Hicom', 'Shah Alam', '40150', 'Selangor', 'Malaysia',
  'CIMB', '9876543210', 'Monthly', '28th', 'Active',
  'SA002', '$2a$10$PQub77fJdQVp1D3LvMl1T.6oSI6/C.Ij7l5BSpXvSGyiBpM5Sv9.2'
  -- pin: Admin@TCL2025
)
ON CONFLICT (id) DO NOTHING;

-- ── Licenses ──────────────────────────────────────────────────────────
INSERT INTO licenses (company_id, tier, max_staff, status, expiry, key, issued_by, issued_on)
VALUES
  ('CO001', 'growth',  25, 'Active', '2027-12-31', 'HRCLOUDCO001-2025', 'PA001', '2025-01-01'),
  ('CO002', 'starter', 10, 'Active', '2026-06-30', 'HRCLOUDCO002-2025', 'PA001', '2025-01-01')
ON CONFLICT (company_id) DO NOTHING;

-- ── Platform Staff ────────────────────────────────────────────────────
INSERT INTO platform_staff (id, name, email, role, password_hash, permissions, is_active)
VALUES
  ('PA001', 'Platform Admin',   'admin@hrcloud.my',   'platform_admin',
   '$2a$10$38UWK3tcPvmqzaH9az9PzeVJAPtIQEmEx0J2tNNJc1aF4qkTrb.jW',
   -- pass: HRCLOUD2025
   '{"all":true}', true),
  ('SA001', 'Support Agent Ahmad', 'ahmad@hrcloud.my', 'support',
   '$2a$10$X9mNdQpTvW8kL5jGrB2hCeM4FnDsHpKvQwRtUyIoPlMbNzAqCxEu6',
   -- pass: Agent@123
   '{"support":true,"chat":true}', true),
  ('SA002', 'Sales Reza',       'reza@hrcloud.my',    'sales',
   '$2a$10$Y4pKeLdFvN9mJ2hBs3gDRfQ8MrEwGjIpTkWuXvOaLnBzCeH5SqFt1',
   -- pass: Sales@123
   '{"crm":true}', true)
ON CONFLICT (id) DO NOTHING;

-- ── HR Config ─────────────────────────────────────────────────────────
INSERT INTO hr_config (company_id, departments, grades, roles, employment_types, statuses)
VALUES (
  'CO001',
  '["Finance","HR","IT","Sales","Operations","Marketing","Legal","Customer Service"]',
  '["G1","G2","G3","G4","G5","G6","M1","M2","M3"]',
  '["Staff","Senior Staff","Executive","Senior Executive","Manager","Senior Manager","Director","Head of Department"]',
  '["Permanent","Contract","Part-Time","Internship","Probation"]',
  '["Active","Probation","Resigned","Terminated","Retired","On Leave"]'
),
(
  'CO002',
  '["Operations","Warehouse","Logistics","Admin","Finance"]',
  '["G1","G2","G3","G4","M1","M2"]',
  '["Staff","Senior Staff","Supervisor","Manager","Director"]',
  '["Permanent","Contract","Part-Time"]',
  '["Active","Probation","Resigned","Terminated"]'
)
ON CONFLICT (company_id) DO NOTHING;

-- ── Payroll Config ────────────────────────────────────────────────────
INSERT INTO payroll_config (company_id, epf_ee_rate, epf_er_rate, socso_ceiling, eis_ceiling, cutoff_day, pay_day)
VALUES ('CO001', 11, 13, 5000, 5000, 25, 28)
ON CONFLICT (company_id) DO NOTHING;

-- ── Leave Config ──────────────────────────────────────────────────────
INSERT INTO leave_config (company_id, leave_types, public_holidays, entitlements)
VALUES (
  'CO001',
  '[
    {"id":"AL","name":"Annual Leave","paid":true,"carry":true,"max":18,"color":"#0EA5C9"},
    {"id":"MC","name":"Medical Leave","paid":true,"carry":false,"max":14,"color":"#DC2626"},
    {"id":"EL","name":"Emergency Leave","paid":true,"carry":false,"max":3,"color":"#D97706"},
    {"id":"UPL","name":"Unpaid Leave","paid":false,"carry":false,"max":60,"color":"#6B7280"},
    {"id":"ML","name":"Maternity Leave","paid":true,"carry":false,"max":98,"color":"#EC4899"},
    {"id":"PL","name":"Paternity Leave","paid":true,"carry":false,"max":7,"color":"#8B5CF6"}
  ]',
  '[
    {"date":"2025-01-01","name":"New Year"},{"date":"2025-01-29","name":"Chinese New Year"},
    {"date":"2025-02-11","name":"Federal Territory Day"},{"date":"2025-04-21","name":"Hari Raya Aidilfitri"},
    {"date":"2025-05-01","name":"Labour Day"},{"date":"2025-08-31","name":"National Day"},
    {"date":"2025-09-16","name":"Malaysia Day"},{"date":"2025-10-20","name":"Deepavali"},
    {"date":"2025-12-25","name":"Christmas"}
  ]',
  '[
    {"grade":"G1","years":0,"days":8},{"grade":"G2","years":2,"days":12},
    {"grade":"G3","years":5,"days":16},{"grade":"G4","years":8,"days":18}
  ]'
)
ON CONFLICT (company_id) DO NOTHING;

-- ── Employees (CO001 — TechCorp) ──────────────────────────────────────
INSERT INTO employees (
  id, company_id, emp_no, name, preferred_name, gender, dob, nric,
  email, work_email, phone, religion, race, marital_status, children, pcb_children,
  dept, grade, role, position, employment_type, join_date, confirm_date, status,
  epf_no, socso_no, eis_no, tax_no,
  basic, allowance, travel, epf_rate, epf_rate_er,
  bank_name, bank_acc
) VALUES
(
  'E001','CO001','EMP001','Ahmad Farid bin Azman','Farid','Male','1985-01-01','850101-14-1234',
  'farid@techcorp.com.my','farid.work@techcorp.com.my','012-3456789',
  'Islam','Malay','Married',2,2,
  'Finance','G4','HR Manager','Senior Finance Manager','Permanent','2018-03-15','2018-09-15','Active',
  'EP-12345601','SO-12345601','EI-12345601','SG-1234560000',
  5800,600,200,11,13,'Maybank','1112223334'
),
(
  'E002','CO001','EMP002','Siti Nuraini binti Hassan','Ain','Female','1990-05-22','900522-10-5678',
  'ain@techcorp.com.my','ain.work@techcorp.com.my','011-2345678',
  'Islam','Malay','Single',0,0,
  'HR','G3','HR Manager','HR Executive','Permanent','2019-06-01','2019-12-01','Active',
  'EP-12345602','SO-12345602','EI-12345602','SG-5678900000',
  4500,400,200,11,13,'CIMB','2223334445'
),
(
  'E003','CO001','EMP003','Rajesh Kumar a/l Subramaniam','Rajesh','Male','1988-11-15','881115-08-3456',
  'rajesh@techcorp.com.my','rajesh.work@techcorp.com.my','016-3456789',
  'Hinduism','Indian','Married',1,1,
  'IT','G4','Manager','Senior IT Manager','Permanent','2017-01-10','2017-07-10','Active',
  'EP-12345603','SO-12345603','EI-12345603','SG-3456780000',
  6200,800,300,11,13,'Maybank','3334445556'
),
(
  'E004','CO001','EMP004','Wei Ting Lim','Wei Ting','Female','1995-03-08','950308-14-7890',
  'weiting@techcorp.com.my','weiting.work@techcorp.com.my','017-4567890',
  'Buddhism','Chinese','Single',0,0,
  'Sales','G2','Staff','Sales Executive','Permanent','2021-04-01','2021-10-01','Active',
  'EP-12345604','SO-12345604','EI-12345604','SG-7890120000',
  3800,300,200,11,13,'Public Bank','4445556667'
),
(
  'E005','CO001','EMP005','Nurul Hidayah binti Razak','Hidayah','Female','1992-07-20','920720-04-2345',
  'hidayah@techcorp.com.my','hidayah.work@techcorp.com.my','014-7778888',
  'Islam','Malay','Married',0,0,
  'Operations','G2','Staff','Operations Assistant','Probation','2022-10-01',NULL,'Probation',
  'EP-12345605','SO-12345605','EI-12345605','SG-2345670000',
  3200,200,100,11,13,'Maybank','5556667778'
)
ON CONFLICT (id) DO NOTHING;

-- ── Payroll Batches ───────────────────────────────────────────────────
INSERT INTO payroll_batches (id, company_id, period, month, working_days, status, created_by, created_at)
VALUES
  ('PAY-2025-05','CO001','May 2025',   '2025-05','26','Confirmed','Ahmad Farid','2025-05-28'),
  ('PAY-2025-06','CO001','June 2025',  '2025-06','26','Draft',    'Ahmad Farid','2025-06-28'),
  ('PAY-2026-01','CO001','January 2026','2026-01','26','Paid',     'Ahmad Farid','2026-01-28')
ON CONFLICT (id) DO NOTHING;

-- ── Notif Settings ────────────────────────────────────────────────────
INSERT INTO notif_settings (renewal_days, block_on_expiry, auto_billing, email_alerts)
VALUES (30, false, false, true)
ON CONFLICT DO NOTHING;

-- ── Email Settings ────────────────────────────────────────────────────
INSERT INTO email_settings (support_mailbox, sla_hours, spam_threshold, spam_action, auto_reply, auto_reply_text)
VALUES (
  'support@hrcloud.my', 24, 5, 'junk', true,
  'Thank you for contacting HRCloud Support. We have received your message and will respond within {{sla}} hours. Reference: {{ticketId}}'
);

-- ── CRM Demo Leads ────────────────────────────────────────────────────
INSERT INTO crm_records (type, data) VALUES
  ('lead', '{"id":"L001","name":"Ali Hassan","company":"Petronas Bhd","email":"ali@petronas.com","phone":"012-1111111","source":"Website","stage":"New","priority":"High","value":15000,"notes":"Interested in Enterprise plan","assignedTo":"SA002"}'),
  ('lead', '{"id":"L002","name":"Mei Ling Tan","company":"AirAsia Berhad","email":"meiling@airasia.com","phone":"011-2222222","source":"Referral","stage":"Qualified","priority":"Medium","value":8000,"notes":"Needs multi-company setup","assignedTo":"SA002"}')
ON CONFLICT DO NOTHING;

-- ── Support Tickets ───────────────────────────────────────────────────
INSERT INTO support_tickets (id, subject, description, company, email, status, priority, category, assigned_to, created_at)
VALUES
  ('TKT-001','Cannot generate payslip for May 2025','Getting an error when clicking Download PDF on payslip',
   'TechCorp Sdn. Bhd.','farid@techcorp.com.my','Open','High','Technical','SA001','2025-06-01'),
  ('TKT-002','Add new department','Need to add Procurement department',
   'TechCorp Sdn. Bhd.','ain@techcorp.com.my','Closed','Low','Account','SA001','2025-05-15')
ON CONFLICT (id) DO NOTHING;

-- ── Knowledge Base ────────────────────────────────────────────────────
INSERT INTO knowledge_base (title, category, content, tags)
VALUES
  ('How to run monthly payroll',           'Payroll',   'Step 1: Go to Payroll module...',         '["payroll","monthly"]'),
  ('How to configure EPF rates',           'Statutory', 'Go to Setup → Payroll Settings...',       '["epf","statutory"]'),
  ('Generating Borang EA for employees',   'Compliance','Navigate to Reports → EA Form (Borang EA)...','["ea","lhdn","tax"]'),
  ('Form E submission guide',              'Compliance','Form E is due 31 March each year...',     '["form-e","lhdn","annual"]')
ON CONFLICT DO NOTHING;

COMMIT;

-- ── Verify ────────────────────────────────────────────────────────────
SELECT 'companies'        AS tbl, COUNT(*) FROM companies
UNION ALL SELECT 'employees',     COUNT(*) FROM employees
UNION ALL SELECT 'payroll_batches',COUNT(*) FROM payroll_batches
UNION ALL SELECT 'licenses',      COUNT(*) FROM licenses
UNION ALL SELECT 'crm_records',   COUNT(*) FROM crm_records
UNION ALL SELECT 'platform_staff',COUNT(*) FROM platform_staff;
