# Live Deployment Guide

This repo can be live in two layers:

1. **GitHub Pages frontend**: shows the HRCloud Malaysia UI.
2. **PostgreSQL backend API**: required for real sign-in/out, company creation, staff records, salary, payroll, and database persistence.

GitHub Pages alone cannot run PostgreSQL. Use a backend/database host such as Render, Railway, Fly.io, Supabase, Neon, or your own VPS.

## Option A: Full Stack On Render

1. Push this repository to GitHub.
2. In Render, choose **New Blueprint** and select the GitHub repo.
3. Render will read `render.yaml` and create:
   - `hrcloud-malaysia-db` PostgreSQL database
   - `hrcloud-malaysia-api` Node API
4. Update `render.yaml`:
   - replace `https://YOUR_GITHUB_USERNAME.github.io` in `ALLOWED_ORIGINS` with your real GitHub Pages URL.
5. After deploy, open:

```text
https://YOUR_RENDER_API_URL/health
```

Expected:

```json
{"status":"ok","db":"connected"}
```

## Option B: Local Full Stack Test With Docker

```powershell
docker compose up -d --build
```

Open:

```text
http://localhost:8080
http://localhost:4000/health
```

Demo logins after seed:

```text
Platform Admin: PA001 / HRCLOUD2025
Super Admin:    SA001 / Admin@TC2025
Employee:       E001 / 141234
```

## Option C: GitHub Pages Frontend Only

GitHub Pages can host the UI from `index.html`, but without a deployed backend it stores data in browser/demo mode only.

To connect to a live backend:

1. Open HRCloud.
2. Go to API/Backend settings in the app.
3. Enable API.
4. Set base URL to:

```text
https://YOUR_RENDER_API_URL/api
```

Then login through the PostgreSQL backend.

## Import Company And Staff Salary

Templates are in:

- `backend/import-templates/company_import.csv`
- `backend/import-templates/staff_salary_import.csv`

Run after database setup:

```powershell
cd backend
node scripts/import_company_staff_csv.js --company import-templates/company_import.csv --staff import-templates/staff_salary_import.csv
```

## Before Going Public

Change these before using real employee data:

- `JWT_SECRET`
- database password
- Super Admin password
- `ALLOWED_ORIGINS`
- license expiry and staff limit

Never commit `.env`, staff private data, NRIC lists, or real salary spreadsheets to GitHub.
