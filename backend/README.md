# HRCloud Malaysia — PostgreSQL Backend

Full REST API replacing all localStorage + hardcoded data.

---

## Stack

| Layer | Tech |
|-------|------|
| Database | PostgreSQL 14+ |
| API Server | Node.js + Express |
| Auth | JWT (bcrypt passwords) |
| ORM | Raw `pg` queries (no ORM overhead) |

---

## Quick Start

### 1. Create PostgreSQL database

```bash
psql -U postgres -c "CREATE USER hrcloud WITH PASSWORD 'hrcloud_pass';"
psql -U postgres -c "CREATE DATABASE hrcloud_malaysia OWNER hrcloud;"
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your real DB credentials and JWT secret
```

### 3. Install and setup

```bash
npm install
npm run setup        # runs migrate + seed
npm run dev          # start dev server with hot reload
```

### 4. Verify

```
GET http://localhost:4000/health
→ {"status":"ok","db":"connected"}
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run migrate` | Create all tables (idempotent) |
| `npm run seed` | Insert demo data |
| `npm run setup` | migrate + seed |
| `npm run dev` | Start with nodemon |
| `npm start` | Production start |
| `npm run reset` | Drop all tables (dev only!) |

---

## Demo Credentials (after seed)

| Role | ID | Password |
|------|----|----------|
| Platform Admin | PA001 | HRCLOUD2025 |
| Super Admin (CO001) | SA001 | Admin@TC2025 |
| Super Admin (CO002) | SA002 | Admin@TCL2025 |
| Employee E001 (Farid) | E001 | 141234 |
| Employee E002 (Ain) | E002 | 105678 |
| Employee E003 (Rajesh) | E003 | 113456 |
| Employee E004 (Wei Ting) | E004 | 147890 |
| Employee E005 (Hidayah) | E005 | 042345 |

> Employee password = last 6 digits of NRIC

---

## API Endpoints

### Auth
```
POST /api/auth/platform      { id, password }
POST /api/auth/superadmin    { id, password, companyId }
POST /api/auth/employee      { id, password, companyId }
GET  /api/auth/me            → current user from JWT
POST /api/auth/refresh       → new token
```

### Companies
```
GET    /api/companies
GET    /api/companies/:id
POST   /api/companies        [platform admin]
PUT    /api/companies/:id
```

### Employees
```
GET    /api/employees?companyId=CO001&status=Active&dept=Finance&search=Ahmad
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id    → sets status=Terminated
```

### Payroll
```
GET    /api/payroll/batches?companyId=CO001
POST   /api/payroll/batches
PUT    /api/payroll/batches/:id/status    { status, note, actor }

GET    /api/payroll/entries?companyId=CO001&batchId=PAY-2025-06
POST   /api/payroll/entries
DELETE /api/payroll/entries/:id
```

### Leaves
```
GET    /api/leaves?companyId=CO001&employeeId=E001
POST   /api/leaves
PUT    /api/leaves/:id/approve    { approvedBy }
PUT    /api/leaves/:id/reject     { rejectedBy, reason }
```

### Config
```
GET/PUT /api/config/hr/:companyId
GET/PUT /api/config/leave/:companyId
GET/PUT /api/config/payroll/:companyId
```

### Licenses
```
GET    /api/licenses
GET    /api/licenses/:companyId
POST   /api/licenses            [platform admin]
PUT    /api/licenses/:companyId [platform admin]
```

### Billing
```
GET    /api/billing?companyId=CO001  [platform admin]
POST   /api/billing                  [platform admin]
PUT    /api/billing/:id/pay          [platform admin]
POST   /api/billing/auto-run         { month: "2026-01" }
```

### CRM
```
GET    /api/crm?type=lead
POST   /api/crm    { type, data }
PUT    /api/crm/:id
DELETE /api/crm/:id
```

### Support
```
GET    /api/support?status=Open
POST   /api/support
PUT    /api/support/:id
GET    /api/support/:id/replies
POST   /api/support/:id/replies
```

### Audit
```
GET    /api/audit?limit=200&module=auth  [platform admin]
POST   /api/audit
DELETE /api/audit                        [platform admin]
```

### Platform Admin
```
GET/POST /api/platform/staff
PUT      /api/platform/staff/:id/password
GET/PUT  /api/platform/notif
GET/POST /api/platform/tiers
GET      /api/groups
POST     /api/groups
DELETE   /api/groups/:id
GET/PUT  /api/email/settings
GET/POST /api/email/rules
PUT      /api/email/rules/:id/hit
DELETE   /api/email/rules/:id
```

---

## Frontend Integration

Include `api.js` in your HTML app:

```html
<script>window.HRCLOUD_API_URL = 'http://localhost:4000';</script>
<script src="api.js"></script>
```

### Replace localStorage calls

**Before (localStorage):**
```js
var employees = JSON.parse(localStorage.getItem('hrcl_v4_employees') || '[]');
localStorage.setItem('hrcl_v4_employees', JSON.stringify(employees));
```

**After (PostgreSQL via API):**
```js
var employees = await HRApi.employees.list('CO001');
await HRApi.employees.update('E001', { basic: 6000 });
```

### Login flow
```js
// Employee login
const result = await HRApi.auth.loginEmployee('E001', '141234', 'CO001');
// result.token is stored automatically in sessionStorage

// Get current user
const user = HRApi.auth.getUser();  // decoded JWT payload
```

### With fallback (graceful degradation)
```js
// Falls back to localStorage if API is unreachable
const employees = await HRApi.helpers.fromDB(
  'hrcl_v4_employees',
  () => HRApi.employees.list(activeCompany)
);
```

---

## Database Schema (18 tables)

```
companies          → company master data
licenses           → per-company license status
license_tiers      → Starter/Growth/Business/Enterprise/Unlimited
employees          → all employee data (59 fields)
payroll_batches    → monthly payroll runs with approval workflow
payroll_entries    → advances, bonuses, deductions per batch
hr_config          → departments, grades, roles, employment types
leave_config       → leave types, public holidays, entitlements
payroll_config     → EPF/SOCSO rates, cutoff day
leave_applications → employee leave requests + approvals
approval_history   → payroll approval audit trail
audit_log          → all platform admin actions
crm_records        → leads, contacts, activities, deals (JSONB)
support_tickets    → helpdesk tickets with attachments
ticket_replies     → threaded ticket conversation
knowledge_base     → KB articles
platform_staff     → platform admin / support / sales accounts
email_settings     → email centre SMTP/IMAP config
email_rules        → auto-routing rules
billing_invoices   → monthly invoices per company
company_groups     → grouping of companies for reporting
notif_settings     → platform notification preferences
platform_sessions  → JWT refresh token store
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a strong random `JWT_SECRET` (32+ chars)
- [ ] Enable SSL on PostgreSQL connection (`ssl: { rejectUnauthorized: true }`)
- [ ] Put API behind nginx reverse proxy
- [ ] Set up `pg_dump` daily backups
- [ ] Use `pm2` or systemd for process management: `pm2 start src/server.js --name hrcloud-api`
- [ ] Change all default passwords in seed before production use
- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain
