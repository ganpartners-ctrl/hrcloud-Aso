-- ============================================================
-- HRCloud Malaysia — Full Database Schema
-- PostgreSQL 14+
-- Run: psql -U hrcloud -d hrcloud_malaysia -f migration_001_init.sql
-- ============================================================

BEGIN;

-- ── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── COMPANIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            VARCHAR(20)  PRIMARY KEY,            -- CO001
  name          VARCHAR(200) NOT NULL,
  trade_name    VARCHAR(200),
  ssm_no        VARCHAR(50),
  lhdn_no       VARCHAR(50),                         -- Employer TIN
  epf_no        VARCHAR(50),
  socso_no      VARCHAR(50),
  eis_no        VARCHAR(50),
  hrdf_no       VARCHAR(50),
  tax_no        VARCHAR(50),
  tax_branch    VARCHAR(100),
  phone         VARCHAR(30),
  email         VARCHAR(150),
  addr1         VARCHAR(200),
  addr2         VARCHAR(200),
  city          VARCHAR(100),
  postcode      VARCHAR(10),
  state         VARCHAR(100),
  country       VARCHAR(100) DEFAULT 'Malaysia',
  bank_name     VARCHAR(100),
  bank_acc      VARCHAR(50),
  payroll_cycle VARCHAR(20)  DEFAULT 'Monthly',
  pay_day       VARCHAR(50),
  logo_url      TEXT,
  status        VARCHAR(20)  DEFAULT 'Active',
  super_admin_id VARCHAR(20),
  super_admin_pin VARCHAR(100),                      -- bcrypt hashed
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── LICENSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id              SERIAL       PRIMARY KEY,
  company_id      VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  tier            VARCHAR(30)  DEFAULT 'starter',
  max_staff       INTEGER      DEFAULT 10,
  status          VARCHAR(30)  DEFAULT 'Active',
  expiry          DATE,
  key             VARCHAR(100),
  issued_by       VARCHAR(50),
  issued_on       DATE         DEFAULT CURRENT_DATE,
  block_warned    DATE,
  block_final_warned DATE,
  block_scheduled DATE,
  blocked_on      DATE,
  trial_end       DATE,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(company_id)
);

-- ── LICENSE TIERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_tiers (
  id          VARCHAR(30)  PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  max_staff   INTEGER,
  color       VARCHAR(20),
  features    JSONB        DEFAULT '[]',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── EMPLOYEES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                VARCHAR(20)  PRIMARY KEY,         -- E001
  company_id        VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  emp_no            VARCHAR(20),
  name              VARCHAR(200) NOT NULL,
  preferred_name    VARCHAR(100),
  gender            VARCHAR(10),
  dob               DATE,
  nric              VARCHAR(20),
  passport_no       VARCHAR(30),
  nationality       VARCHAR(50)  DEFAULT 'Malaysian',
  email             VARCHAR(150),
  work_email        VARCHAR(150),
  phone             VARCHAR(30),
  religion          VARCHAR(50),
  race              VARCHAR(50),
  marital_status    VARCHAR(20)  DEFAULT 'Single',
  spouse_nric       VARCHAR(20),
  spouse_name       VARCHAR(200),
  children          INTEGER      DEFAULT 0,
  pcb_children      INTEGER      DEFAULT 0,
  spouse_relief     BOOLEAN      DEFAULT false,
  dept              VARCHAR(100),
  grade             VARCHAR(20),
  role              VARCHAR(50)  DEFAULT 'Staff',
  position          VARCHAR(100),
  employment_type   VARCHAR(30)  DEFAULT 'Permanent',
  join_date         DATE,
  confirm_date      DATE,
  resign_date       DATE,
  status            VARCHAR(30)  DEFAULT 'Active',
  warnings          INTEGER      DEFAULT 0,
  -- Statutory
  epf_no            VARCHAR(30),
  socso_no          VARCHAR(30),
  eis_no            VARCHAR(30),
  tax_no            VARCHAR(30),
  tax_branch        VARCHAR(100),
  -- Payroll
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
  -- Zakat
  zakat_eligible    BOOLEAN       DEFAULT false,
  zakat_type        VARCHAR(10)   DEFAULT 'amount',
  zakat_amount      NUMERIC(12,2) DEFAULT 0,
  zakat_rate        NUMERIC(5,2)  DEFAULT 0,
  zakat_body        VARCHAR(200),
  zakat_ref_no      VARCHAR(50),
  -- Immigration
  permit_no         VARCHAR(50),
  permit_exp        DATE,
  -- Bank
  bank_name         VARCHAR(100),
  bank_acc          VARCHAR(50),
  bank_code         VARCHAR(20),
  -- Address
  addr1             VARCHAR(200),
  addr2             VARCHAR(200),
  city              VARCHAR(100),
  postcode          VARCHAR(10),
  state             VARCHAR(100),
  -- Profile
  photo_url         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- ── PAYROLL BATCHES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_batches (
  id            VARCHAR(30)  PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  period        VARCHAR(50),
  month         VARCHAR(7),                           -- 2025-06
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

-- ── PAYROLL ENTRIES (overrides per batch) ──────────────────
CREATE TABLE IF NOT EXISTS payroll_entries (
  id          SERIAL       PRIMARY KEY,
  batch_id    VARCHAR(30)  REFERENCES payroll_batches(id) ON DELETE CASCADE,
  employee_id VARCHAR(20)  REFERENCES employees(id) ON DELETE CASCADE,
  company_id  VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  type        VARCHAR(30),                            -- advance, bonus, deduct, recurring
  label       VARCHAR(200),
  amount      NUMERIC(12,2),
  is_recurring BOOLEAN     DEFAULT false,
  note        TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(batch_id, employee_id, type, label)
);

-- ── HR CONFIG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_config (
  id            SERIAL       PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  departments   JSONB        DEFAULT '[]',
  grades        JSONB        DEFAULT '[]',
  roles         JSONB        DEFAULT '[]',
  employment_types JSONB     DEFAULT '[]',
  statuses      JSONB        DEFAULT '[]',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── LEAVE CONFIG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_config (
  id            SERIAL       PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  leave_types   JSONB        DEFAULT '[]',
  public_holidays JSONB      DEFAULT '[]',
  entitlements  JSONB        DEFAULT '[]',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── PAYROLL CONFIG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_config (
  id            SERIAL       PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  epf_ee_rate   NUMERIC(5,2) DEFAULT 11,
  epf_er_rate   NUMERIC(5,2) DEFAULT 13,
  socso_ceiling NUMERIC(10,2) DEFAULT 5000,
  eis_ceiling   NUMERIC(10,2) DEFAULT 5000,
  cutoff_day    INTEGER      DEFAULT 25,
  pay_day       INTEGER      DEFAULT 28,
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── LEAVE APPLICATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_applications (
  id            VARCHAR(30)  PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   VARCHAR(20)  REFERENCES employees(id) ON DELETE CASCADE,
  type          VARCHAR(50),
  type_color    VARCHAR(20),
  from_date     DATE,
  to_date       DATE,
  days          NUMERIC(4,1),
  reason        TEXT,
  status        VARCHAR(20)  DEFAULT 'Pending',
  submitted_on  DATE         DEFAULT CURRENT_DATE,
  approved_by   VARCHAR(200),
  approved_on   DATE,
  rejected_by   VARCHAR(200),
  rejected_on   DATE,
  reject_reason TEXT,
  doc_name      VARCHAR(200),
  doc_data      TEXT,                                 -- base64
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── APPROVAL HISTORY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_history (
  id          SERIAL       PRIMARY KEY,
  company_id  VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  batch_id    VARCHAR(30),
  action      VARCHAR(30),
  status      VARCHAR(30),
  actor       VARCHAR(200),
  note        TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL       PRIMARY KEY,
  actor       VARCHAR(50),
  action      VARCHAR(100),
  target      VARCHAR(200),
  detail      TEXT,
  severity    VARCHAR(20)  DEFAULT 'info',
  module      VARCHAR(50),
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── CRM ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_records (
  id          SERIAL       PRIMARY KEY,
  type        VARCHAR(20)  NOT NULL,                  -- lead, contact, activity, deal
  data        JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── SUPPORT TICKETS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id            VARCHAR(20)  PRIMARY KEY,
  subject       VARCHAR(300) NOT NULL,
  description   TEXT,
  company       VARCHAR(200),
  email         VARCHAR(150),
  status        VARCHAR(30)  DEFAULT 'Open',
  priority      VARCHAR(20)  DEFAULT 'Medium',
  category      VARCHAR(50),
  source        VARCHAR(30),
  assigned_to   VARCHAR(100),
  crm_lead_id   VARCHAR(30),
  attach_name   VARCHAR(200),
  attach_data   TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── TICKET REPLIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_replies (
  id          SERIAL       PRIMARY KEY,
  ticket_id   VARCHAR(20)  REFERENCES support_tickets(id) ON DELETE CASCADE,
  author      VARCHAR(100),
  body        TEXT,
  is_internal BOOLEAN      DEFAULT false,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── KNOWLEDGE BASE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id          SERIAL       PRIMARY KEY,
  title       VARCHAR(300) NOT NULL,
  category    VARCHAR(100),
  content     TEXT,
  tags        JSONB        DEFAULT '[]',
  views       INTEGER      DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── PLATFORM STAFF ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_staff (
  id            VARCHAR(20)  PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(150),
  role          VARCHAR(50),
  password_hash VARCHAR(200),
  permissions   JSONB        DEFAULT '{}',
  is_active     BOOLEAN      DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── EMAIL SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_settings (
  id              SERIAL       PRIMARY KEY,
  support_mailbox VARCHAR(150),
  imap_host       VARCHAR(200),
  imap_port       INTEGER,
  smtp_host       VARCHAR(200),
  smtp_port       INTEGER,
  username        VARCHAR(150),
  password        VARCHAR(200),
  auto_reply      BOOLEAN      DEFAULT true,
  auto_reply_text TEXT,
  sla_hours       INTEGER      DEFAULT 24,
  spam_threshold  INTEGER      DEFAULT 5,
  spam_action     VARCHAR(20)  DEFAULT 'junk',
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ── EMAIL RULES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_rules (
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

-- ── BILLING ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_invoices (
  id            VARCHAR(30)  PRIMARY KEY,
  company_id    VARCHAR(20)  REFERENCES companies(id) ON DELETE CASCADE,
  invoice_no    VARCHAR(30),
  date          DATE         DEFAULT CURRENT_DATE,
  due_date      DATE,
  status        VARCHAR(20)  DEFAULT 'Unpaid',
  period        VARCHAR(50),
  subtotal      NUMERIC(12,2),
  tax           NUMERIC(12,2),
  total         NUMERIC(12,2),
  items         JSONB        DEFAULT '[]',
  auto_generated BOOLEAN     DEFAULT false,
  paid_on       DATE,
  receipt_no    VARCHAR(30),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── COMPANY GROUPS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_groups (
  id          VARCHAR(30)  PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  color       VARCHAR(20),
  member_ids  JSONB        DEFAULT '[]',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── NOTIF SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notif_settings (
  id                  SERIAL   PRIMARY KEY,
  renewal_days        INTEGER  DEFAULT 30,
  block_on_expiry     BOOLEAN  DEFAULT false,
  auto_billing        BOOLEAN  DEFAULT false,
  email_alerts        BOOLEAN  DEFAULT true,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLATFORM SESSIONS (JWT blacklist/refresh) ───────────────
CREATE TABLE IF NOT EXISTS platform_sessions (
  id          VARCHAR(100) PRIMARY KEY,
  staff_id    VARCHAR(20),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_company    ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status     ON employees(status);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_co   ON payroll_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_mon  ON payroll_batches(month);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_bat  ON payroll_entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_leave_apps_emp       ON leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_apps_co        ON leave_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created    ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_company      ON billing_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_type             ON crm_records(type);
CREATE INDEX IF NOT EXISTS idx_tickets_status       ON support_tickets(status);

-- ── AUTO-UPDATE updated_at ───────────────────────────────────
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

COMMIT;
