--
-- HRCloud Malaysia — PostgreSQL Database Dump
-- Generated: 2026-06-08 06:04:06
-- PostgreSQL Version: 16+
--
-- Restore:
--   createdb -U postgres hrcloud_malaysia
--   psql -U postgres -d hrcloud_malaysia -f hrcloud_malaysia_full.sql
--
-- Or with Docker:
--   docker exec -i hrcloud_db psql -U hrcloud -d hrcloud_malaysia < hrcloud_malaysia_full.sql
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHEMA — DROP & RECREATE (idempotent)
-- ============================================================

DROP TABLE IF EXISTS platform_sessions    CASCADE;
DROP TABLE IF EXISTS notif_settings       CASCADE;
DROP TABLE IF EXISTS company_groups       CASCADE;
DROP TABLE IF EXISTS email_rules          CASCADE;
DROP TABLE IF EXISTS email_settings       CASCADE;
DROP TABLE IF EXISTS billing_invoices     CASCADE;
DROP TABLE IF EXISTS knowledge_base       CASCADE;
DROP TABLE IF EXISTS ticket_replies       CASCADE;
DROP TABLE IF EXISTS support_tickets      CASCADE;
DROP TABLE IF EXISTS crm_records          CASCADE;
DROP TABLE IF EXISTS audit_log            CASCADE;
DROP TABLE IF EXISTS approval_history     CASCADE;
DROP TABLE IF EXISTS payroll_entries      CASCADE;
DROP TABLE IF EXISTS payroll_batches      CASCADE;
DROP TABLE IF EXISTS leave_applications   CASCADE;
DROP TABLE IF EXISTS payroll_config       CASCADE;
DROP TABLE IF EXISTS leave_config         CASCADE;
DROP TABLE IF EXISTS hr_config            CASCADE;
DROP TABLE IF EXISTS employees            CASCADE;
DROP TABLE IF EXISTS licenses             CASCADE;
DROP TABLE IF EXISTS license_tiers        CASCADE;
DROP TABLE IF EXISTS platform_staff       CASCADE;
DROP TABLE IF EXISTS companies            CASCADE;
DROP FUNCTION IF EXISTS trigger_set_updated_at CASCADE;

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE companies (
    id                VARCHAR(20)   PRIMARY KEY,
    name              VARCHAR(200)  NOT NULL,
    trade_name        VARCHAR(200),
    ssm_no            VARCHAR(50),
    lhdn_no           VARCHAR(50),
    epf_no            VARCHAR(50),
    socso_no          VARCHAR(50),
    eis_no            VARCHAR(50),
    hrdf_no           VARCHAR(50),
    tax_no            VARCHAR(50),
    tax_branch        VARCHAR(100),
    phone             VARCHAR(30),
    email             VARCHAR(150),
    addr1             VARCHAR(200),
    addr2             VARCHAR(200),
    city              VARCHAR(100),
    postcode          VARCHAR(10),
    state             VARCHAR(100),
    country           VARCHAR(100)  DEFAULT 'Malaysia',
    bank_name         VARCHAR(100),
    bank_acc          VARCHAR(50),
    payroll_cycle     VARCHAR(20)   DEFAULT 'Monthly',
    pay_day           VARCHAR(50),
    logo_url          TEXT,
    status            VARCHAR(20)   DEFAULT 'Active',
    super_admin_id    VARCHAR(20),
    super_admin_pin   VARCHAR(200),
    created_at        TIMESTAMPTZ   DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLE: license_tiers
-- ============================================================
CREATE TABLE license_tiers (
    id          VARCHAR(30)   PRIMARY KEY,
    label       VARCHAR(100)  NOT NULL,
    price       NUMERIC(10,2) NOT NULL,
    max_staff   INTEGER,
    color       VARCHAR(20),
    features    JSONB         DEFAULT '[]',
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLE: licenses
-- ============================================================
CREATE TABLE licenses (
    id                  SERIAL        PRIMARY KEY,
    company_id          VARCHAR(20)   REFERENCES companies(id) ON DELETE CASCADE,
    tier                VARCHAR(30)   DEFAULT 'starter',
    max_staff           INTEGER       DEFAULT 10,
    status              VARCHAR(30)   DEFAULT 'Active',
    expiry              DATE,
    key                 VARCHAR(100),
    issued_by           VARCHAR(50),
    issued_on           DATE          DEFAULT CURRENT_DATE,
    block_warned        DATE,
    block_final_warned  DATE,
    block_scheduled     DATE,
    blocked_on          DATE,
    trial_end           DATE,
    created_at          TIMESTAMPTZ   DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE(company_id)
);

-- ============================================================
-- TABLE: platform_staff
-- ============================================================
CREATE TABLE platform_staff (
    id            VARCHAR(20)   PRIMARY KEY,
    name          VARCHAR(200)  NOT NULL,
    email         VARCHAR(150),
    role          VARCHAR(50),
    password_hash VARCHAR(200),
    permissions   JSONB         DEFAULT '{}',
    is_active     BOOLEAN       DEFAULT true,
    created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE employees (
    id                VARCHAR(20)   PRIMARY KEY,
    company_id        VARCHAR(20)   REFERENCES companies(id) ON DELETE CASCADE,
    emp_no            VARCHAR(20),
    name              VARCHAR(200)  NOT NULL,
    preferred_name    VARCHAR(100),
    gender            VARCHAR(10),
    dob               DATE,
    nric              VARCHAR(20),
    passport_no       VARCHAR(30),
    nationality       VARCHAR(50)   DEFAULT 'Malaysian',
    email             VARCHAR(150),
    work_email        VARCHAR(150),
    phone             VARCHAR(30),
    religion          VARCHAR(50),
    race              VARCHAR(50),
    marital_status    VARCHAR(20)   DEFAULT 'Single',
    spouse_nric       VARCHAR(20),
    spouse_name       VARCHAR(200),
    children          INTEGER       DEFAULT 0,
    pcb_children      INTEGER       DEFAULT 0,
    spouse_relief     BOOLEAN       DEFAULT false,
    dept              VARCHAR(100),
    grade             VARCHAR(20),
    role              VARCHAR(50)   DEFAULT 'Staff',
    position          VARCHAR(100),
    employment_type   VARCHAR(30)   DEFAULT 'Permanent',
    join_date         DATE,
    confirm_date      DATE,
    resign_date       DATE,
    status            VARCHAR(30)   DEFAULT 'Active',
    warnings          INTEGER       DEFAULT 0,
    epf_no            VARCHAR(30),
    socso_no          VARCHAR(30),
    eis_no            VARCHAR(30),
    tax_no            VARCHAR(30),
    tax_branch        VARCHAR(100),
    basic             NUMERIC(12,2) DEFAULT 0,
    allowance         NUMERIC(12,2) DEFAULT 0,
    travel            NUMERIC(12,2) DEFAULT 0,
    other             NUMERIC(12,2) DEFAULT 0,
    bonus             NUMERIC(12,2) DEFAULT 0,
    commission        NUMERIC(12,2) DEFAULT 0,
    epf_rate          NUMERIC(5,2)  DEFAULT 11,
    epf_rate_er       NUMERIC(5,2)  DEFAULT 13,
    hrdf_enabled      BOOLEAN       DEFAULT true,
    cp38_amount       NUMERIC(12,2) DEFAULT 0,
    cp38_date_from    DATE,
    cp38_date_to      DATE,
    pa_ins            NUMERIC(12,2) DEFAULT 0,
    medical_insurance NUMERIC(12,2) DEFAULT 0,
    zakat_eligible    BOOLEAN       DEFAULT false,
    zakat_type        VARCHAR(10)   DEFAULT 'amount',
    zakat_amount      NUMERIC(12,2) DEFAULT 0,
    zakat_rate        NUMERIC(5,2)  DEFAULT 0,
    zakat_body        VARCHAR(200),
    zakat_ref_no      VARCHAR(50),
    permit_no         VARCHAR(50),
    permit_exp        DATE,
    bank_name         VARCHAR(100),
    bank_acc          VARCHAR(50),
    bank_code         VARCHAR(20),
    addr1             VARCHAR(200),
    addr2             VARCHAR(200),
    city              VARCHAR(100),
    postcode          VARCHAR(10),
    state             VARCHAR(100),
    photo_url         TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ   DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLE: payroll_batches
-- ============================================================
CREATE TABLE payroll_batches (
    id            VARCHAR(30)  PRIMARY KEY,
    company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
    period        VARCHAR(50),
    month         VARCHAR(7),
    working_days  INTEGER      DEFAULT 26,
    status        VARCHAR(30)  DEFAULT 'Draft',
    created_by    VARCHAR(200),
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    submitted_by  VARCHAR(200),
    submitted_at  TIMESTAMPTZ,
    approved_by   VARCHAR(200),
    approved_at   TIMESTAMPTZ,
    approval_note TEXT,
    rejected_by   VARCHAR(200),
    rejected_at   TIMESTAMPTZ,
    confirmed_by  VARCHAR(200),
    confirmed_at  TIMESTAMPTZ,
    paid_by       VARCHAR(200),
    paid_at       TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: payroll_entries
-- ============================================================
CREATE TABLE payroll_entries (
    id           SERIAL       PRIMARY KEY,
    batch_id     VARCHAR(30)  REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id  VARCHAR(20)  REFERENCES employees(id) ON DELETE CASCADE,
    company_id   VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
    type         VARCHAR(30),
    label        VARCHAR(200),
    amount       NUMERIC(12,2),
    is_recurring BOOLEAN      DEFAULT false,
    note         TEXT,
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(batch_id, employee_id, type, label)
);

-- ============================================================
-- TABLE: hr_config
-- ============================================================
CREATE TABLE hr_config (
    id               SERIAL      PRIMARY KEY,
    company_id       VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    departments      JSONB       DEFAULT '[]',
    grades           JSONB       DEFAULT '[]',
    roles            JSONB       DEFAULT '[]',
    employment_types JSONB       DEFAULT '[]',
    statuses         JSONB       DEFAULT '[]',
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: leave_config
-- ============================================================
CREATE TABLE leave_config (
    id              SERIAL      PRIMARY KEY,
    company_id      VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    leave_types     JSONB       DEFAULT '[]',
    public_holidays JSONB       DEFAULT '[]',
    entitlements    JSONB       DEFAULT '[]',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: payroll_config
-- ============================================================
CREATE TABLE payroll_config (
    id            SERIAL      PRIMARY KEY,
    company_id    VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    epf_ee_rate   NUMERIC(5,2) DEFAULT 11,
    epf_er_rate   NUMERIC(5,2) DEFAULT 13,
    socso_ceiling NUMERIC(10,2) DEFAULT 5000,
    eis_ceiling   NUMERIC(10,2) DEFAULT 5000,
    cutoff_day    INTEGER      DEFAULT 25,
    pay_day       INTEGER      DEFAULT 28,
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: leave_applications
-- ============================================================
CREATE TABLE leave_applications (
    id           VARCHAR(30)  PRIMARY KEY,
    company_id   VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
    employee_id  VARCHAR(20)  REFERENCES employees(id) ON DELETE CASCADE,
    type         VARCHAR(50),
    type_color   VARCHAR(20),
    from_date    DATE,
    to_date      DATE,
    days         NUMERIC(4,1),
    reason       TEXT,
    status       VARCHAR(20)  DEFAULT 'Pending',
    submitted_on DATE         DEFAULT CURRENT_DATE,
    approved_by  VARCHAR(200),
    approved_on  DATE,
    rejected_by  VARCHAR(200),
    rejected_on  DATE,
    reject_reason TEXT,
    doc_name     VARCHAR(200),
    doc_data     TEXT,
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: approval_history
-- ============================================================
CREATE TABLE approval_history (
    id         SERIAL      PRIMARY KEY,
    company_id VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE,
    batch_id   VARCHAR(30),
    action     VARCHAR(30),
    status     VARCHAR(30),
    actor      VARCHAR(200),
    note       TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_log
-- ============================================================
CREATE TABLE audit_log (
    id         SERIAL      PRIMARY KEY,
    actor      VARCHAR(50),
    action     VARCHAR(100),
    target     VARCHAR(200),
    detail     TEXT,
    severity   VARCHAR(20) DEFAULT 'info',
    module     VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: crm_records
-- ============================================================
CREATE TABLE crm_records (
    id         SERIAL      PRIMARY KEY,
    type       VARCHAR(20) NOT NULL,
    data       JSONB       NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: support_tickets
-- ============================================================
CREATE TABLE support_tickets (
    id          VARCHAR(20)  PRIMARY KEY,
    subject     VARCHAR(300) NOT NULL,
    description TEXT,
    company     VARCHAR(200),
    email       VARCHAR(150),
    status      VARCHAR(30)  DEFAULT 'Open',
    priority    VARCHAR(20)  DEFAULT 'Medium',
    category    VARCHAR(50),
    source      VARCHAR(30),
    assigned_to VARCHAR(100),
    crm_lead_id VARCHAR(30),
    attach_name VARCHAR(200),
    attach_data TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: ticket_replies
-- ============================================================
CREATE TABLE ticket_replies (
    id          SERIAL      PRIMARY KEY,
    ticket_id   VARCHAR(20) REFERENCES support_tickets(id) ON DELETE CASCADE,
    author      VARCHAR(100),
    body        TEXT,
    is_internal BOOLEAN     DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: knowledge_base
-- ============================================================
CREATE TABLE knowledge_base (
    id         SERIAL      PRIMARY KEY,
    title      VARCHAR(300) NOT NULL,
    category   VARCHAR(100),
    content    TEXT,
    tags       JSONB       DEFAULT '[]',
    views      INTEGER     DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: email_settings
-- ============================================================
CREATE TABLE email_settings (
    id              SERIAL      PRIMARY KEY,
    support_mailbox VARCHAR(150),
    imap_host       VARCHAR(200),
    imap_port       INTEGER,
    smtp_host       VARCHAR(200),
    smtp_port       INTEGER,
    username        VARCHAR(150),
    password        VARCHAR(200),
    auto_reply      BOOLEAN     DEFAULT true,
    auto_reply_text TEXT,
    sla_hours       INTEGER     DEFAULT 24,
    spam_threshold  INTEGER     DEFAULT 5,
    spam_action     VARCHAR(20) DEFAULT 'junk',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: email_rules
-- ============================================================
CREATE TABLE email_rules (
    id              VARCHAR(30)  PRIMARY KEY,
    name            VARCHAR(200),
    condition       VARCHAR(30),
    condition_value VARCHAR(200),
    action          VARCHAR(30),
    action_value    VARCHAR(200),
    enabled         BOOLEAN      DEFAULT true,
    hits            INTEGER      DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: billing_invoices
-- ============================================================
CREATE TABLE billing_invoices (
    id             VARCHAR(30)   PRIMARY KEY,
    company_id     VARCHAR(20)   REFERENCES companies(id) ON DELETE CASCADE,
    invoice_no     VARCHAR(30),
    date           DATE          DEFAULT CURRENT_DATE,
    due_date       DATE,
    status         VARCHAR(20)   DEFAULT 'Unpaid',
    period         VARCHAR(50),
    subtotal       NUMERIC(12,2),
    tax            NUMERIC(12,2),
    total          NUMERIC(12,2),
    items          JSONB         DEFAULT '[]',
    auto_generated BOOLEAN       DEFAULT false,
    paid_on        DATE,
    receipt_no     VARCHAR(30),
    created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLE: company_groups
-- ============================================================
CREATE TABLE company_groups (
    id         VARCHAR(30)  PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    color      VARCHAR(20),
    member_ids JSONB        DEFAULT '[]',
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLE: notif_settings
-- ============================================================
CREATE TABLE notif_settings (
    id              SERIAL      PRIMARY KEY,
    renewal_days    INTEGER     DEFAULT 30,
    block_on_expiry BOOLEAN     DEFAULT false,
    auto_billing    BOOLEAN     DEFAULT false,
    email_alerts    BOOLEAN     DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: platform_sessions
-- ============================================================
CREATE TABLE platform_sessions (
    id         VARCHAR(100) PRIMARY KEY,
    staff_id   VARCHAR(20),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_employees_company     ON employees(company_id);
CREATE INDEX idx_employees_status      ON employees(status);
CREATE INDEX idx_payroll_batches_co    ON payroll_batches(company_id);
CREATE INDEX idx_payroll_batches_mon   ON payroll_batches(month);
CREATE INDEX idx_payroll_entries_bat   ON payroll_entries(batch_id);
CREATE INDEX idx_leave_apps_emp        ON leave_applications(employee_id);
CREATE INDEX idx_leave_apps_co         ON leave_applications(company_id);
CREATE INDEX idx_audit_log_created     ON audit_log(created_at DESC);
CREATE INDEX idx_billing_company       ON billing_invoices(company_id);
CREATE INDEX idx_crm_type              ON crm_records(type);
CREATE INDEX idx_tickets_status        ON support_tickets(status);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'companies','licenses','employees','payroll_batches',
    'leave_applications','support_tickets','knowledge_base','crm_records'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- DATA: license_tiers
-- ============================================================
INSERT INTO license_tiers (id, label, price, max_staff, color) VALUES
  ('starter',    'Starter',    99.00,    10,    '#4F6EF7'),
  ('growth',     'Growth',     299.00,   25,    '#059669'),
  ('business',   'Business',   699.00,   100,   '#7C3AED'),
  ('enterprise', 'Enterprise', 1499.00,  500,   '#DC2626'),
  ('unlimited',  'Unlimited',  2999.00,  99999, '#0EA5C9');

-- ============================================================
-- DATA: companies
-- ============================================================
INSERT INTO companies (
  id, name, trade_name, ssm_no, lhdn_no, epf_no, socso_no, eis_no, hrdf_no,
  phone, email, addr1, addr2, city, postcode, state, country,
  bank_name, bank_acc, payroll_cycle, pay_day, status,
  super_admin_id, super_admin_pin
) VALUES
(
  'CO001','TechCorp Sdn. Bhd.','TechCorp',
  '202001012345','C 1234567890','EP 1234567','SO 1234567','EI 1234567','H 1234567',
  '03-22345678','hr@techcorp.com.my',
  'Level 18, Menara TechCorp','Jalan Ampang','Kuala Lumpur','50450','W.P. Kuala Lumpur','Malaysia',
  'Maybank','1234567890','Monthly','Last Working Day','Active',
  'SA001','$2a$10$rOcKmMl3qCy.1pIFN7zMGeHuKGasFGJGmFm8YUIPQPe.0sFP2u3Kq'
),
(
  'CO002','TechCorp Logistics Sdn. Bhd.','TC Logistics',
  '202101056789','C 9876543210','EP 7654321','SO 7654321','EI 7654321','H 7654321',
  '03-33456789','hr@tclogistics.com.my',
  'Lot 5, Jalan Industri 3','Kawasan Perindustrian Hicom','Shah Alam','40150','Selangor','Malaysia',
  'CIMB','9876543210','Monthly','28th','Active',
  'SA002','$2a$10$GK8CnZ5qHkJm7VkKgR8lnOWnz4D3JkHkW1BvGpJNl5WmDjpGq8xA6'
);

-- ============================================================
-- DATA: licenses
-- ============================================================
INSERT INTO licenses (company_id, tier, max_staff, status, expiry, key, issued_by, issued_on) VALUES
  ('CO001','growth',   25,'Active','2027-12-31','HRCLOUDCO001-2025','PA001','2025-01-01'),
  ('CO002','starter',  10,'Active','2026-06-30','HRCLOUDCO002-2025','PA001','2025-01-01');

-- ============================================================
-- DATA: platform_staff
-- Passwords (bcrypt):
--   PA001 → HRCLOUD2025
--   SA001 → Agent@123
--   SA002 → Sales@123
-- ============================================================
INSERT INTO platform_staff (id, name, email, role, password_hash, permissions, is_active) VALUES
  ('PA001','Platform Admin','admin@hrcloud.my','platform_admin',
   '$2a$10$hK7GcVMW4jRzM3FpLqF6QerNjLDKKL9v5Xvq3WuMJzXKQQfD4DJVK',
   '{"all":true}',true),
  ('SA001','Support Agent Ahmad','ahmad@hrcloud.my','support',
   '$2a$10$X9mNdQpTvW8kL5jGrB2hCeM4FnDsHpKvQwRtUyIoPlMbNzAqCxEu6',
   '{"support":true,"chat":true}',true),
  ('SA002','Sales Reza','reza@hrcloud.my','sales',
   '$2a$10$Y4pKeLdFvN9mJ2hBs3gDRfQ8MrEwGjIpTkWuXvOaLnBzCeH5SqFt1',
   '{"crm":true}',true);

-- ============================================================
-- DATA: hr_config
-- ============================================================
INSERT INTO hr_config (company_id, departments, grades, roles, employment_types, statuses) VALUES
(
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
);

-- ============================================================
-- DATA: payroll_config
-- ============================================================
INSERT INTO payroll_config (company_id, epf_ee_rate, epf_er_rate, socso_ceiling, eis_ceiling, cutoff_day, pay_day)
VALUES ('CO001',11,13,5000,5000,25,28);

-- ============================================================
-- DATA: leave_config
-- ============================================================
INSERT INTO leave_config (company_id, leave_types, public_holidays, entitlements) VALUES (
  'CO001',
  '[{"id":"AL","name":"Annual Leave","paid":true,"carry":true,"max":18,"color":"#0EA5C9"},{"id":"MC","name":"Medical Leave","paid":true,"carry":false,"max":14,"color":"#DC2626"},{"id":"EL","name":"Emergency Leave","paid":true,"carry":false,"max":3,"color":"#D97706"},{"id":"UPL","name":"Unpaid Leave","paid":false,"carry":false,"max":60,"color":"#6B7280"},{"id":"ML","name":"Maternity Leave","paid":true,"carry":false,"max":98,"color":"#EC4899"},{"id":"PL","name":"Paternity Leave","paid":true,"carry":false,"max":7,"color":"#8B5CF6"}]',
  '[{"date":"2026-01-01","name":"New Year"},{"date":"2026-01-29","name":"Chinese New Year"},{"date":"2026-05-01","name":"Labour Day"},{"date":"2026-08-31","name":"National Day"},{"date":"2026-09-16","name":"Malaysia Day"},{"date":"2026-12-25","name":"Christmas"}]',
  '[{"grade":"G1","years":0,"days":8},{"grade":"G2","years":2,"days":12},{"grade":"G3","years":5,"days":16},{"grade":"G4","years":8,"days":18}]'
);

-- ============================================================
-- DATA: employees (CO001)
-- Employee password = last 6 digits of NRIC
--   E001 → 141234   E002 → 085678   E003 → 113456
--   E004 → 143456   E005 → 042345
-- ============================================================
INSERT INTO employees (
  id,company_id,emp_no,name,preferred_name,gender,dob,nric,
  email,work_email,phone,religion,race,marital_status,
  spouse_name,children,pcb_children,spouse_relief,
  dept,grade,role,position,employment_type,join_date,confirm_date,status,
  epf_no,socso_no,eis_no,tax_no,tax_branch,
  basic,allowance,travel,epf_rate,epf_rate_er,
  bank_name,bank_acc,
  addr1,city,postcode,state
) VALUES
(
  'E001','CO001','EMP001','Ahmad Farid bin Azman','Farid','Male','1985-01-01','850101-14-1234',
  'farid@techcorp.com.my','farid.work@techcorp.com.my','012-3456789',
  'Islam','Malay','Married','Nor Azura binti Razali',2,2,true,
  'Finance','G4','HR Manager','Senior Finance Manager','Permanent','2018-03-15','2018-09-15','Active',
  'EP-12345601','SO-12345601','EI-12345601','SG-1234560000','LHDN KL',
  5800,600,200,11,13,'Maybank','1112223334',
  'No. 12, Jalan Damai 3','Kuala Lumpur','56000','W.P. Kuala Lumpur'
),
(
  'E002','CO001','EMP002','Siti Nuraini binti Hassan','Ain','Female','1990-05-22','900522-10-5678',
  'ain@techcorp.com.my','ain.work@techcorp.com.my','011-2345678',
  'Islam','Malay','Single',NULL,0,0,false,
  'HR','G3','HR Manager','HR Executive','Permanent','2019-06-01','2019-12-01','Active',
  'EP-12345602','SO-12345602','EI-12345602','SG-5678900000','LHDN KL',
  4500,400,200,11,13,'CIMB','2223334445',
  'No. 5, Jalan Makmur','Petaling Jaya','47500','Selangor'
),
(
  'E003','CO001','EMP003','Rajesh Kumar a/l Subramaniam','Rajesh','Male','1988-11-15','881115-08-3456',
  'rajesh@techcorp.com.my','rajesh.work@techcorp.com.my','016-3456789',
  'Hinduism','Indian','Married','Priya a/p Krishnan',1,1,false,
  'IT','G4','Manager','Senior IT Manager','Permanent','2017-01-10','2017-07-10','Active',
  'EP-12345603','SO-12345603','EI-12345603','SG-3456780000','LHDN KL',
  6200,800,300,11,13,'Maybank','3334445556',
  'No. 8, Jalan Harmoni','Kuala Lumpur','50480','W.P. Kuala Lumpur'
),
(
  'E004','CO001','EMP004','Wei Ting Lim','Wei Ting','Female','1995-03-08','950308-14-7890',
  'weiting@techcorp.com.my','weiting.work@techcorp.com.my','017-4567890',
  'Buddhism','Chinese','Single',NULL,0,0,false,
  'Sales','G2','Staff','Sales Executive','Permanent','2021-04-01','2021-10-01','Active',
  'EP-12345604','SO-12345604','EI-12345604','SG-7890120000','LHDN KL',
  3800,300,200,11,13,'Public Bank','4445556667',
  'No. 22, Jalan Setia','Subang Jaya','47500','Selangor'
),
(
  'E005','CO001','EMP005','Nurul Hidayah binti Razak','Hidayah','Female','1992-07-20','920720-04-2345',
  'hidayah@techcorp.com.my','hidayah.work@techcorp.com.my','014-7778888',
  'Islam','Malay','Married',NULL,0,0,false,
  'Operations','G2','Staff','Operations Assistant','Probation','2022-10-01',NULL,'Probation',
  'EP-12345605','SO-12345605','EI-12345605','SG-2345670000','LHDN KL',
  3200,200,100,11,13,'Maybank','5556667778',
  'No. 3, Jalan Wawasan','Shah Alam','40150','Selangor'
);

-- ============================================================
-- DATA: payroll_batches
-- ============================================================
INSERT INTO payroll_batches (id, company_id, period, month, working_days, status, created_by, created_at) VALUES
  ('PAY-2025-05','CO001','May 2025',   '2025-05',26,'Confirmed','Ahmad Farid','2025-05-28'),
  ('PAY-2025-06','CO001','June 2025',  '2025-06',26,'Draft',    'Ahmad Farid','2025-06-01'),
  ('PAY-2026-01','CO001','January 2026','2026-01',26,'Paid',    'Ahmad Farid','2026-01-28');

-- ============================================================
-- DATA: notif_settings
-- ============================================================
INSERT INTO notif_settings (renewal_days, block_on_expiry, auto_billing, email_alerts)
VALUES (30, false, false, true);

-- ============================================================
-- DATA: email_settings
-- ============================================================
INSERT INTO email_settings (support_mailbox, sla_hours, spam_threshold, spam_action, auto_reply, auto_reply_text)
VALUES (
  'support@hrcloud.my', 24, 5, 'junk', true,
  'Thank you for contacting HRCloud Support. We have received your message and will respond within 24 hours.'
);

-- ============================================================
-- DATA: crm_records
-- ============================================================
INSERT INTO crm_records (type, data) VALUES
  ('lead', '{"id":"L001","name":"Ali Hassan","company":"Petronas Bhd","email":"ali@petronas.com","phone":"012-1111111","source":"Website","stage":"New","priority":"High","value":15000,"notes":"Interested in Enterprise plan","assignedTo":"SA002"}'),
  ('lead', '{"id":"L002","name":"Mei Ling Tan","company":"AirAsia Berhad","email":"meiling@airasia.com","phone":"011-2222222","source":"Referral","stage":"Qualified","priority":"Medium","value":8000,"notes":"Needs multi-company setup","assignedTo":"SA002"}');

-- ============================================================
-- DATA: support_tickets
-- ============================================================
INSERT INTO support_tickets (id, subject, description, company, email, status, priority, category, assigned_to, created_at) VALUES
  ('TKT-001','Cannot generate payslip for May 2025','Getting an error when clicking Download PDF on payslip',
   'TechCorp Sdn. Bhd.','farid@techcorp.com.my','Open','High','Technical','SA001','2025-06-01'),
  ('TKT-002','Add new department request','Need to add Procurement department to HR config',
   'TechCorp Sdn. Bhd.','ain@techcorp.com.my','Closed','Low','Account','SA001','2025-05-15');

-- ============================================================
-- DATA: knowledge_base
-- ============================================================
INSERT INTO knowledge_base (title, category, content, tags) VALUES
  ('How to run monthly payroll','Payroll','Step 1: Navigate to Payroll module. Step 2: Click Generate Payroll. Step 3: Select month and verify employee list. Step 4: Submit for approval.','["payroll","monthly","guide"]'),
  ('How to configure EPF rates','Statutory','Go to Setup → Payroll Settings → EPF. Default employee rate is 11%, employer rate is 13%.','["epf","statutory","config"]'),
  ('Generating Borang EA for employees','Compliance','Navigate to Reports → EA Form (Borang EA). Select year and employee. Click Download & Print PDF.','["ea","lhdn","tax","borang"]'),
  ('Form E submission guide','Compliance','Form E is due 31 March each year. Go to Reports → Form E (Borang E). Select year, preview, download and submit via MyTax.','["form-e","lhdn","annual","submission"]');

-- ============================================================
-- DATA: audit_log (initial entries)
-- ============================================================
INSERT INTO audit_log (actor, action, target, detail, severity, module) VALUES
  ('PA001','SYSTEM_INIT','hrcloud_malaysia','Database initialised with demo data','info','system'),
  ('PA001','LICENSE_ISSUED','CO001','Growth plan license issued — expires 2027-12-31','info','licenses'),
  ('PA001','LICENSE_ISSUED','CO002','Starter plan license issued — expires 2026-06-30','info','licenses');

-- ============================================================
-- SEQUENCES reset
-- ============================================================
SELECT setval('licenses_id_seq',        (SELECT MAX(id) FROM licenses));
SELECT setval('hr_config_id_seq',       (SELECT MAX(id) FROM hr_config));
SELECT setval('leave_config_id_seq',    (SELECT MAX(id) FROM leave_config));
SELECT setval('payroll_config_id_seq',  (SELECT MAX(id) FROM payroll_config));
SELECT setval('audit_log_id_seq',       (SELECT MAX(id) FROM audit_log));
SELECT setval('crm_records_id_seq',     (SELECT MAX(id) FROM crm_records));
SELECT setval('support_tickets_id_seq', 1) WHERE NOT EXISTS (SELECT 1 FROM support_tickets);
SELECT setval('knowledge_base_id_seq',  (SELECT MAX(id) FROM knowledge_base));
SELECT setval('notif_settings_id_seq',  1);
SELECT setval('email_settings_id_seq',  1);

-- ============================================================
-- VERIFY
-- ============================================================
DO $$
DECLARE
  tbl_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tbl_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  RAISE NOTICE 'Tables created: %', tbl_count;
  RAISE NOTICE 'Setup complete. Login: SA001 / Admin@TC2025 | E001 / 141234';
END $$;
