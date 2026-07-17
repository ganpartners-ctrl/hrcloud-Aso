# HRCloud PostgreSQL Onboarding

Use this backend for real company, staff, and salary data. The static HTML demo is useful for UI review, but production data should go through this PostgreSQL API.

## 1. Database

Create PostgreSQL database:

```powershell
psql -U postgres -c "CREATE USER hrcloud WITH PASSWORD 'hrcloud_pass';"
psql -U postgres -c "CREATE DATABASE hrcloud_malaysia OWNER hrcloud;"
```

Create `.env` from `.env.example`, then update the password/host if needed.

## 2. Install And Start

```powershell
cd "C:\Users\User\Documents\New project\hrcloud-malaysia-github-review\hrcloud-malaysia-github\backend"
npm install
npm run migrate
npm run seed
npm start
```

Check:

```text
http://localhost:4000/health
```

Expected result:

```json
{"status":"ok","db":"connected"}
```

## 3. Create Company And Super Admin

Use the platform admin login first:

```text
PA001 / HRCLOUD2025
```

Then create the company with:

```http
POST /api/companies
```

The backend creates the company and one license row together. The company CSV template also includes Super Admin ID and password.

## 4. Import Company And Staff Salary Data

Templates:

- `import-templates/company_import.csv`
- `import-templates/staff_salary_import.csv`

Run:

```powershell
node scripts/import_company_staff_csv.js --company import-templates/company_import.csv --staff import-templates/staff_salary_import.csv
```

Dates may be `DD-MM-YYYY` or `YYYY-MM-DD`. Money values must be plain numbers without currency symbols.

## 5. Data Needed From Client

For company:

- Company name, SSM, LHDN, EPF, SOCSO, EIS, HRDF numbers
- Address, phone, email, bank info
- Super Admin ID and password
- License tier, staff limit, expiry date

For staff:

- Employee ID/no, name, NRIC, department, grade, role, position
- Join date, confirmation date, employment type, status
- Basic salary and fixed monthly allowances
- EPF/SOCSO/EIS/tax numbers
- Bank account details
- PCB/children/spouse relief/zakat/CP38 where applicable

## 6. Important

The current browser-only demo stores data locally. For HRCloud Malaysia production use, always run the API at `http://localhost:4000` or deploy it to a real server, then point the frontend API URL to that backend.
