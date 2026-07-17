# HRCloud Malaysia — Database

## Files

| File | Description |
|------|-------------|
| `hrcloud_malaysia_full.sql` | **Complete database** — schema (23 tables) + all demo data in one file |

---

## Restore Options

### Option 1 — Directly with psql

```bash
# Create database
createdb -U postgres hrcloud_malaysia

# Restore everything (schema + data)
psql -U postgres -d hrcloud_malaysia -f hrcloud_malaysia_full.sql
```

### Option 2 — Docker (recommended, no PostgreSQL install needed)

```bash
# From repo root
docker compose up -d

# The database is created automatically on first start.
# To restore manually into a running Docker container:
docker exec -i hrcloud_db psql -U hrcloud -d hrcloud_malaysia < database/hrcloud_malaysia_full.sql
```

### Option 3 — pgAdmin / DBeaver / TablePlus

1. Open your PostgreSQL GUI tool
2. Create a new database named `hrcloud_malaysia`
3. Right-click → Restore / Run SQL file
4. Select `hrcloud_malaysia_full.sql`
5. Execute

### Option 4 — Railway / Supabase / Neon (cloud PostgreSQL)

```bash
# Get your connection string from the platform dashboard, then:
psql "postgresql://user:password@host:5432/hrcloud_malaysia" -f database/hrcloud_malaysia_full.sql
```

---

## What's Inside

### 23 Tables

| Table | Records | Description |
|-------|---------|-------------|
| `companies` | 2 | TechCorp Sdn. Bhd. + TC Logistics |
| `license_tiers` | 5 | Starter / Growth / Business / Enterprise / Unlimited |
| `licenses` | 2 | One per company |
| `platform_staff` | 3 | PA001 (admin), SA001 (support), SA002 (sales) |
| `employees` | 5 | E001–E005 with full payroll & statutory data |
| `payroll_batches` | 3 | May 2025, June 2025, January 2026 |
| `hr_config` | 2 | Departments, grades, roles per company |
| `leave_config` | 1 | Leave types, public holidays, entitlements |
| `payroll_config` | 1 | EPF/SOCSO rates, cutoff day |
| `support_tickets` | 2 | Sample helpdesk tickets |
| `knowledge_base` | 4 | KB articles |
| `crm_records` | 2 | Sample leads |
| `email_settings` | 1 | Support mailbox config |
| `notif_settings` | 1 | Platform notifications |
| `audit_log` | 3 | Initial audit entries |
| `approval_history` | 0 | Empty — populated on use |
| `payroll_entries` | 0 | Empty — populated on use |
| `leave_applications` | 0 | Empty — populated on use |
| `billing_invoices` | 0 | Empty — populated on use |
| `crm_records` | 2 | |
| `company_groups` | 0 | Empty |
| `email_rules` | 0 | Empty |
| `ticket_replies` | 0 | Empty |
| `platform_sessions` | 0 | Empty |

### Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Platform Admin | PA001 | HRCLOUD2025 |
| Super Admin (TechCorp) | SA001 | Admin@TC2025 |
| Super Admin (TC Logistics) | SA002 | Admin@TCL2025 |
| Employee (Ahmad Farid) | E001 | 141234 |
| Employee (Siti Nuraini) | E002 | 085678 |
| Employee (Rajesh) | E003 | 109012 |
| Employee (Wei Ting) | E004 | 143456 |
| Employee (Hidayah) | E005 | 037890 |

> Passwords are bcrypt-hashed in the database. Employee password = last 6 digits of NRIC.

---

## Schema Summary

```
companies ──────────────────────────────────────────────────────┐
  ├── licenses (1:1)                                             │
  ├── employees (1:many) ───────────────────────────────────────┤
  │     ├── leave_applications                                   │
  │     └── payroll_entries (via batch)                         │
  ├── payroll_batches (1:many)                                   │
  │     ├── payroll_entries (1:many)                            │
  │     └── approval_history                                    │
  ├── hr_config (1:1)                                           │
  ├── leave_config (1:1)                                        │
  ├── payroll_config (1:1)                                      │
  └── billing_invoices (1:many)                                 │
                                                                │
platform (global) ──────────────────────────────────────────────┘
  ├── platform_staff
  ├── license_tiers
  ├── company_groups
  ├── audit_log
  ├── crm_records
  ├── support_tickets ── ticket_replies
  ├── knowledge_base
  ├── email_settings
  ├── email_rules
  ├── notif_settings
  └── platform_sessions
```
