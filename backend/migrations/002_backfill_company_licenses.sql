-- Ensure every existing company has a license row.
-- This fixes companies created before the create-company route started
-- inserting a default license automatically.

INSERT INTO licenses (company_id, tier, max_staff, status, expiry, key, issued_by, issued_on)
SELECT
  c.id,
  'growth',
  25,
  'Active',
  '2027-12-31',
  'HRCLOUD' || c.id || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
  'PA001',
  CURRENT_DATE
FROM companies c
LEFT JOIN licenses l ON l.company_id = c.id
WHERE l.company_id IS NULL;
