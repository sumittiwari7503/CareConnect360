# CareConnect360 Environment Setup & Prerequisites

**Project:** CareConnect360 (Project ID: P_013)  
**Date:** November 1, 2026  

---

## 1. System Tooling & Runtime Prerequisites

| Component | Minimum Version | Verified Local Status |
|-----------|-----------------|-----------------------|
| **Java Development Kit (JDK)** | Java 21+ LTS | **Installed:** OpenJDK 25.0.2 LTS (`Temurin-25.0.2+10`) at `/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home` |
| **Node.js** | Node 20.x or 22.x | **Installed:** `v22.23.2` |
| **npm** | npm 10.x | **Installed:** `10.9.8` |
| **Angular CLI** | `@angular/cli` 18.x | Available via local `package.json` |
| **Build Tool** | Apache Maven 3.9+ | Configured via `pom.xml` |
| **Database** | Oracle Database 19c/21c/23c Free | **Status:** Unverified locally on port 1521 (scripts prepared; H2 Oracle-mode fallback available for testing) |

---

## 2. Environment Variables

Create a local `.env` or set in your shell before launching the backend:

```bash
# Java Runtime (JDK 21 Target)
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"

# Oracle Connection (When connecting to live Oracle instance)
export ORACLE_URL="jdbc:oracle:thin:@localhost:1521/FREEPDB1"
export ORACLE_USERNAME="careconnect"
export ORACLE_PASSWORD="careconnect_pass"

# Security & Tokens
export JWT_SECRET="4c617265436f6e6e6563743336305365637572654a77745365637265744b657932303236456e74657270726973654b6579"
```

---

## 3. Step-by-Step Launch Instructions

### Step 1: Database Provisioning (Oracle)
If using Docker:
```bash
docker run -d \
  --name careconnect-oracle \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=CareConnectPass123# \
  -e APP_USER=careconnect \
  -e APP_USER_PASSWORD=careconnect_pass \
  gvenzl/oracle-free:latest
```
Execute DDL and seed scripts:
```bash
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1 < database/01_schema_ddl.sql
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1 < database/02_seed_demo_data.sql
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1 < database/03_audit_triggers.sql
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1 < database/04_migration_add_synthetic_flag.sql
sqlplus careconnect/careconnect_pass@//localhost:1521/FREEPDB1 < database/05_migration_add_vitals_provenance.sql
```

### Step 2: Spring Boot Backend Service
```bash
cd backend
mvn clean spring-boot:run
```
*Note: If Oracle is not running, the application starts with `-Dspring-boot.run.profiles=dev`, which loads the in-memory H2 database in Oracle compatibility mode.*

### Step 3: Angular Frontend Application
```bash
cd frontend
npm install
npm start
```
Navigate to `http://localhost:4200/`.
