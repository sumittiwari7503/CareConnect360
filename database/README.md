# CareConnect360 Database Schema & Migration Guide (Oracle DB)

**Project:** CareConnect360 (Project ID: P_013)  
**Database Target:** Oracle Database 19c, 21c, or 23c (including Oracle Free / XE)  
**Status:** Scripts Ready — Execution unverified in local sandbox until Oracle listener is provisioned.

---

## 1. Directory Structure

```text
database/
├── 01_schema_ddl.sql                       # Core tables, constraints, sequences, and indexes
├── 02_seed_demo_data.sql                   # Synthetic demo seed data (users, patients, doctors, appointments, vitals, prescriptions, invoices, audit records)
├── 03_audit_triggers.sql                   # Database-level triggers enforcing audit immutability and timestamp auto-updates
├── 04_migration_add_synthetic_flag.sql     # Standalone migration: IS_SYNTHETIC flag and check constraint on DOCTOR_PROFILES
├── 05_migration_add_vitals_provenance.sql  # Standalone migration: VITALS_PROVENANCE and clinical constraint on CONSULTATION_RECORDS
└── README.md                               # Migration & execution documentation
```

---

## 2. Prerequisites & Local Oracle Setup

### Option A: Running Local Oracle via Docker / Podman
To spin up a containerized Oracle Database 23c Free instance:

```bash
docker run -d \
  --name careconnect-oracle \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=CareConnectPass123# \
  -e APP_USER=careconnect \
  -e APP_USER_PASSWORD=careconnect_pass \
  gvenzl/oracle-free:latest
```

Wait ~60 seconds for the database to complete initialization (`docker logs -f careconnect-oracle`).

### Option B: Existing Oracle Database / Oracle Cloud ATP
Ensure you have access to an Oracle service name (e.g. `FREEPDB1` or `ORCLPDB1`) with privileges to create tables, sequences, and triggers.

---

## 3. Executing Migrations

### Using SQL*Plus or SQLcl:
```bash
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1

-- Inside SQL*Plus:
@database/01_schema_ddl.sql
@database/02_seed_demo_data.sql
@database/03_audit_triggers.sql
```

### Using Flyway (Automated Migration):
Place scripts in `backend/src/main/resources/db/migration/` renamed with standard version prefixes:
- `V1__init_schema.sql` (from `01_schema_ddl.sql`)
- `V2__seed_demo_data.sql` (from `02_seed_demo_data.sql`)
- `V3__audit_triggers.sql` (from `03_audit_triggers.sql`)

---

## 4. Synthetic Demo Credentials Summary

All seeded demo accounts use the standard demo password:
- **Default Demo Password:** `CareConnect360!`
- **BCrypt Hash:** `$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W`

| Role | Name | Email | Identifier |
|------|------|-------|------------|
| Super Admin | Priya Sundaram, MHA | `priya.sundaram@careconnect360.com` | `ADMIN-001` |
| Cardiologist | Dr. Rajesh Nair, MD, DM | `dr.rajesh.nair@example.com` | Reg: `MMC-CARD-88391` |
| Internist | Dr. Priya Patel, MD | `dr.priya.patel@example.com` | Reg: `KMC-MED-99201` |
| Pediatrician | Dr. Ananya Sharma, MD | `dr.ananya.sharma@example.com` | Reg: `DMC-PED-44912` |
| Neurologist | Dr. Vikram Malhotra, MD | `dr.vikram.malhotra@example.com` | Reg: `MMC-NEUR-49210` |
| Patient | Aarav Sharma | `aarav.sharma@example.com` | MRN: `MRN-IND-849204` |
| Patient | Rohan Verma | `rohan.verma@example.com` | MRN: `MRN-IND-551029` |
| Triage Nurse | Kavita Reddy, RN | `kavita.reddy@example.com` | Staff ID: `TRI-104` |

*Notice: All demographic, institutional, and clinical information is strictly synthetic for development and testing.*
