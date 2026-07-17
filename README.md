# HRCloud Malaysia — Enterprise HR & Payroll Platform

> Full-stack Malaysian HR SaaS — Payroll, Statutory Compliance, Leave, LHDN Forms, Multi-Company, Platform Admin

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://yourname.github.io/hrcloud-malaysia)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)](./backend)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2014%2B-blue)](./backend/migrations)

---

## 📁 Repository Structure

```
hrcloud-malaysia/
│
├── index.html                          ← GitHub Pages entry (copy of frontend/index.html)
│
├── frontend/
│   ├── index.html                      ← Full single-file app (React, no build step)
│   ├── api.js                          ← Frontend API layer (connects to PostgreSQL backend)
│   └── templates/
│       ├── HRCloud_Employee_Import_Template.xlsx
│       ├── HRCloud_Attendance_Import_Template.xlsx
│       └── HRCloud_Shift_Schedule_Import_Template.xlsx
│
├── backend/
│   ├── src/
│   │   ├── server.js                   ← Express entry point
│   │   ├── db/pool.js                  ← PostgreSQL connection pool
│   │   ├── middleware/auth.js          ← JWT auth middleware
│   │   └── routes/                     ← 14 REST API route files
│   │       ├── auth.js                 ← Login (Platform Admin / Super Admin / Employee)
│   │       ├── companies.js
│   │       ├── employees.js
│   │       ├── payroll.js
│   │       ├── leaves.js
│   │       ├── config.js               ← HR / Leave / Payroll config
│   │       ├── licenses.js
│   │       ├── billing.js
│   │       ├── crm.js
│   │       ├── support.js
│   │       ├── audit.js
│   │       ├── groups.js
│   │       ├── email.js
│   │       └── platform.js
│   ├── migrations/
│   │   └── 001_init.sql               ← Full schema — 23 tables
│   ├── seeds/
│   │   └── seed_demo.sql              ← Demo data (2 companies, 5 employees, full config)
│   ├── scripts/
│   │   ├── migrate.js
│   │   ├── seed.js
│   │   └── reset.js                   ← Dev only — drops all tables
│   ├── api.js                         ← Frontend API integration layer
│   ├── package.json
│   ├── .env.example
│   └── README.md                      ← Full API reference
│
└── .gitignore
```

---


## 🐳 Quickest Start — Docker (Recommended)

No PostgreSQL installation needed. One command runs **everything** — database, API, and frontend.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

```bash
# Clone the repo
git clone https://github.com/yourname/hrcloud-malaysia.git
cd hrcloud-malaysia

# Start everything (database + API + frontend)
docker compose up -d

# First run automatically:
#   ✓ Creates PostgreSQL database
#   ✓ Runs migration (creates all 23 tables)
#   ✓ Seeds demo data (companies, employees, config)
#   ✓ Starts API on http://localhost:4000
#   ✓ Serves frontend on http://localhost:8080
```

Open **http://localhost:8080** — the app is ready.

```bash
# Stop everything
docker compose down

# Stop and DELETE all data (fresh start)
docker compose down -v

# View logs
docker compose logs -f api
docker compose logs -f db

# Connect to database directly
docker exec -it hrcloud_db psql -U hrcloud -d hrcloud_malaysia
```

---

## 🚀 Manual Setup (without Docker)

### Option A — Frontend Only (GitHub Pages, no backend needed)

1. **Fork / clone** this repo
2. **Enable GitHub Pages**: Settings → Pages → Branch: `main` → Root `/`
3. App is live at `https://yourname.github.io/hrcloud-malaysia`

Data is stored in the browser's **localStorage** — perfect for demos and testing.

---

### Option B — Full Stack (Frontend + PostgreSQL backend)

**Prerequisites:** Node.js 18+, PostgreSQL 14+

```bash
# 1. Create the database
psql -U postgres << SQL
  CREATE USER hrcloud WITH PASSWORD 'hrcloud_pass';
  CREATE DATABASE hrcloud_malaysia OWNER hrcloud;
SQL

# 2. Configure environment
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# 3. Install, migrate, seed
npm install
npm run setup        # creates all 23 tables + inserts demo data

# 4. Start API
npm run dev          # http://localhost:4000

# 5. Open frontend
# Open frontend/index.html in a browser, or serve with any static server
```

---

## 🔐 Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Platform Admin | `PA001` | `HRCLOUD2025` |
| Super Admin — TechCorp Sdn. Bhd. | `SA001` | `Admin@TC2025` |
| Super Admin — TC Logistics Sdn. Bhd. | `SA002` | `Admin@TCL2025` |
| HR Manager (Ahmad Farid) | `E001` | `141234` |
| HR Manager (Siti Nuraini) | `E002` | `085678` |
| Manager (Rajesh) | `E003` | `109012` |
| Staff (Wei Ting) | `E004` | `143456` |
| Staff (Hidayah) | `E005` | `037890` |

> **Employee password** = last 6 digits of NRIC number

---

## ✨ Features

### HR & Payroll
- Monthly payroll computation — EPF, SOCSO, EIS, PCB/MTD, HRDF, Zakat
- Payroll approval workflow — Draft → Submit → Approve → Confirm → Paid
- Leave management with approval flow, entitlement tracking
- Employee profiles — 55+ fields including all Malaysian statutory numbers
- Attendance & shift scheduling — clock in/out, overtime, flexible hours

### LHDN Statutory Forms
| Form | Description | Due Date |
|------|-------------|----------|
| **Borang EA (CP8A)** | Employee income statement — individual download & batch generator | 28 Feb |
| **Form E (Borang E) + CP8D** | Employer annual return — 3-page form with employee listing | 31 Mar |
| **CP21** | Employee cessation notification | On cessation |
| **CP22** | New employee notification | 30 days from join |
| **CP22A** | Retirement / death notification | On event |

### Reports (19+)
- Master Payroll, Payroll Ledger, Payroll Register
- EPF, SOCSO, EIS, PCB statutory reports
- Zakat Deduction Listing
- HRDF Levy Report
- **Consolidated Payroll** — multi-company with group selector
- Bank File Generator (Maybank GIRO, CIMB BizChannel, RHB Reflex)
- All reports: inline preview, HTML download, Excel, CSV, Print/PDF

### Platform Admin
- Multi-company management with company groups
- Licensing tiers (Starter / Growth / Business / Enterprise / Unlimited)
- Auto-billing with SST 8%, invoice generation
- CRM — leads → email compose → convert to ticket
- Support helpdesk with file attachments and threaded replies
- Email Centre with auto-routing rules engine
- Full audit log with CSV export

### Import / Data Migration
| Template | Columns | Purpose |
|----------|---------|---------|
| `HRCloud_Employee_Import_Template.xlsx` | 55 | Bulk add/update employees |
| `HRCloud_Attendance_Import_Template.xlsx` | 15 | Clock in/out — monthly or permanent |
| `HRCloud_Shift_Schedule_Import_Template.xlsx` | 22 | Shift arrangements per employee |

Templates available in `frontend/templates/` or downloadable from **Import → 📖 Guide** in the app.

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 via CDN (no build step) |
| Styling | Custom CSS — fully responsive, mobile-friendly |
| Backend | Node.js 18 + Express 4 |
| Database | PostgreSQL 14+ |
| Auth | JWT (8h) + bcrypt passwords |
| PDF Generation | HTML → browser print → Save as PDF |
| Data Storage | PostgreSQL (production) / localStorage (frontend-only mode) |

---

## 🗄 Database Schema

23 tables covering every data domain:

```
companies            license_tiers        platform_staff
licenses             employees            payroll_batches
payroll_entries      hr_config            leave_config
payroll_config       leave_applications   approval_history
audit_log            crm_records          support_tickets
ticket_replies       knowledge_base       email_settings
email_rules          billing_invoices     company_groups
notif_settings       platform_sessions
```

Full schema: [`backend/migrations/001_init.sql`](./backend/migrations/001_init.sql)  
Demo data: [`backend/seeds/seed_demo.sql`](./backend/seeds/seed_demo.sql)

---

## 📡 API Reference

See [`backend/README.md`](./backend/README.md) for full endpoint documentation.

Base URL: `http://localhost:4000/api`

```
POST /api/auth/platform          Platform Admin login
POST /api/auth/superadmin        Company Super Admin login
POST /api/auth/employee          Employee login

GET  /api/employees?companyId=CO001
POST /api/employees
PUT  /api/employees/:id

GET  /api/payroll/batches?companyId=CO001
PUT  /api/payroll/batches/:id/status

GET  /api/leaves?companyId=CO001&employeeId=E001
POST /api/leaves
PUT  /api/leaves/:id/approve

POST /api/billing/auto-run       { month: "2026-01" }
GET  /api/audit?limit=200
```

---

## 🇲🇾 Malaysian Compliance

| Regulation | Coverage |
|-----------|---------|
| EPF Act 1991 | Employer/Employee contributions, opt-out, schedules |
| Social Security Act 1969 | SOCSO — First Schedule rates |
| Employment Insurance Act 2017 | EIS deductions |
| Income Tax Act 1967 | PCB/MTD — Monthly Tax Deduction |
| HRD Corp Act | HRDF Levy — 1% basic salary |
| Income Tax Act s.6A(3) | Zakat salary deduction — 14 bodies |
| Income Tax Act s.83(1A) | Borang EA — due 28 February |
| Income Tax Act s.83(1) | Form E + CP8D — due 31 March |

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://hrcloud:hrcloud_pass@localhost:5432/hrcloud_malaysia

# Server
PORT=4000
NODE_ENV=development

# Auth
JWT_SECRET=change_this_to_a_long_random_secret_in_production
JWT_EXPIRES_IN=8h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourname.github.io
```

---

## 📦 Production Deployment

```bash
# Backend (PM2)
npm install -g pm2
pm2 start backend/src/server.js --name hrcloud-api

# Frontend — push to GitHub, enable Pages
# Or deploy to Netlify / Vercel / any static host
```

**Checklist before going live:**
- [ ] Change `JWT_SECRET` to a 32+ char random string
- [ ] Change all demo passwords in `seed_demo.sql`
- [ ] Set `NODE_ENV=production`
- [ ] Enable SSL on PostgreSQL
- [ ] Configure `ALLOWED_ORIGINS` to your domain
- [ ] Set up `pg_dump` daily backups

---

## 📄 License

Private — Internal use only. © 2025–2026 HRCloud Malaysia.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request
