-- Company isolation and mobile/security fields for HRCloud Malaysia.
-- Run this in Supabase SQL Editor after 001_init.sql and 002_backfill_company_licenses.sql.

BEGIN;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_device_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_access VARCHAR(30) DEFAULT 'Allowed';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_bound_on DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS geo_lat VARCHAR(40);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS geo_lng VARCHAR(40);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS geo_radius VARCHAR(20);

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS company_id VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_records ADD COLUMN IF NOT EXISTS company_id VARCHAR(20) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS company_id VARCHAR(20) REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_mobile_device ON employees(mobile_device_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company ON audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_company ON crm_records(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON support_tickets(company_id);

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

CREATE OR REPLACE FUNCTION app_current_company_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_company_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.current_role', true), '') = 'platform_admin'
$$;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_isolation_companies ON companies;
CREATE POLICY company_isolation_companies ON companies
  FOR ALL
  USING (app_is_platform_admin() OR id = app_current_company_id())
  WITH CHECK (app_is_platform_admin() OR id = app_current_company_id());

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'licenses',
    'employees',
    'payroll_batches',
    'payroll_entries',
    'hr_config',
    'leave_config',
    'payroll_config',
    'leave_applications',
    'approval_history',
    'audit_log',
    'crm_records',
    'support_tickets',
    'billing_invoices'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS company_isolation_%1$I ON %1$I', tbl);
    EXECUTE format(
      'CREATE POLICY company_isolation_%1$I ON %1$I
       FOR ALL
       USING (app_is_platform_admin() OR company_id = app_current_company_id())
       WITH CHECK (app_is_platform_admin() OR company_id = app_current_company_id())',
      tbl
    );
  END LOOP;
END $$;

COMMIT;
