# HRCloud Malaysia — Enterprise HR & Sign-In Platform

## Live URLs (after Vercel deploy)

| URL | What it is |
|-----|-----------|
| `https://hrcloud-malaysia-aso.vercel.app/` | **Staff Sign-In app** (clock in/out, geofence, device binding) |
| `https://hrcloud-malaysia-aso.vercel.app/app/` | **Main HRCloud app** (payroll, EA/Form E, leave, reports) |
| `https://hrcloud-malaysia-aso.vercel.app/signin` | Sign-In app (explicit URL) |
| `https://hrcloud-malaysia-aso.vercel.app/templates/` | Import CSV/XLSX templates |

---

## Repository Structure

```
hrcloud-malaysia/
│
├── index.html              ← HRCloud Sign-In app (161KB, served at /)
├── signin.html             ← Same — explicit /signin URL
├── vercel.json             ← Vercel routing config
│
├── app/
│   └── index.html          ← Main HRCloud Enterprise app (6.4MB, at /app/)
│
├── templates/
│   ├── HRCloud_Employee_Import_Template.xlsx
│   ├── HRCloud_Attendance_Import_Template.xlsx
│   ├── HRCloud_Shift_Schedule_Import_Template.xlsx
│   ├── HRSignIn_Company_Import_Template.csv
│   └── HRSignIn_Staff_Import_Template.csv
│
├── backend/
│   ├── src/
│   │   ├── server.js       ← Express API entry (port 4000)
│   │   ├── db/pool.js      ← PostgreSQL pool
│   │   ├── middleware/auth.js
│   │   └── routes/         ← 14 REST route files
│   ├── migrations/001_init.sql   ← 23-table PostgreSQL schema
│   ├── seeds/seed_demo.sql       ← Demo data
│   ├── scripts/migrate.js seed.js reset.js
│   ├── package.json
│   └── .env.example
│
└── database/
    ├── 001_schema.sql      ← Schema only
    └── 002_seed_demo.sql   ← Demo data
```

---

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "Update: GPS timeclock, admin login, setup wizard"
git push origin main
```

### Step 2 — Vercel auto-deploys
Vercel detects the push and deploys automatically.
- Root `/` serves the Sign-In app
- `/app/` serves the main HRCloud app
- `/templates/` serves import files

---

## Sign-In App Features

- **GPS hard gate** — staff cannot clock in/out without location access
- **Geofence** — only within office radius (Admin → Geofence Config)
- **Device binding** — one phone per staff member
- **Admin login** — password-protected Admin + Setup tabs
- **3-step Setup Wizard** — guided first-time company setup
- **PWA** — installable on Android / iPhone / Huawei
- **IndexedDB** — real browser database, works offline
- **HRCloud export** — attendance CSV in HRCloud import format

### Sign-In Login Credentials
| Role | ID | Password | Company |
|------|----|----------|---------|
| Company Admin | SA001 | Admin@TC2025 | TechCorp Sdn. Bhd. |
| Company Admin | SA002 | Admin@TCL2025 | TC Logistics |
| Platform Admin | PA001 | HRCLOUD2025 | All companies |
| Staff | E001 | (auto-filled) | — |

---

## Main HRCloud App Features (at /app/)

- Payroll: EPF/SOCSO/EIS/PCB/HRDF/Zakat
- LHDN forms: Borang EA (CP8A), Form E + CP8D
- Leave management with approval flow
- 19+ reports including bank files
- Multi-company Platform Admin
- Billing with SST 8%

### Main App Login Credentials
| Role | ID | Password |
|------|----|----------|
| Platform Admin | PA001 | HRCLOUD2025 |
| Super Admin (TechCorp) | SA001 | Admin@TC2025 |
| Super Admin (Logistics) | SA002 | Admin@TCL2025 |
| Employee Farid | E001 | 141234 |
| Employee Ain | E002 | 085678 |
| Employee Rajesh | E003 | 109012 |
| Employee Wei Ting | E004 | 143456 |
| Employee Hidayah | E005 | 037890 |

---

## Backend API (separate deployment)

Deploy the `/backend` folder to Railway, Render, or any Node.js host.

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npm run setup    # creates tables + inserts demo data
npm start        # http://localhost:4000
```

API base: `http://your-api-host/api`

---

## Database

PostgreSQL 14+. Two ways to set up:

**Option A — scripts:**
```bash
psql -U postgres -c "CREATE DATABASE hrcloud_malaysia OWNER hrcloud;"
psql -U hrcloud -d hrcloud_malaysia -f database/001_schema.sql
psql -U hrcloud -d hrcloud_malaysia -f database/002_seed_demo.sql
```

**Option B — Docker:**
```bash
docker compose up -d   # from repo root (if docker-compose.yml exists)
```
