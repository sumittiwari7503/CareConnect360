# CareConnect360 Backend Service (Spring Boot 3.3.4 + Java 21)

**Project:** CareConnect360 (Project ID: P_013)  
**Framework:** Spring Boot 3.3.4 / Java 21  
**Database Support:** Dual-mode (Oracle Database 19c/21c/23c production profile + Oracle-mode H2 dev profile)

---

## 1. Architecture & Security Features

- **Stateless Authentication:** JWT Bearer tokens with HMAC-SHA256 signing (`io.jsonwebtoken`).
- **Password Security:** Salted BCrypt password encoding (`BCryptPasswordEncoder`). Plaintext passwords are never stored.
- **Server-Side Authorization:** Role-Based Access Control (`ROLE_PATIENT`, `ROLE_DOCTOR`, `ROLE_ADMIN`, `ROLE_TRIAGE`).
- **HIPAA Level-4 Clinical Audit Trail:** Automated event recording with cryptographic SHA-256 verification hashes stored in `CLINICAL_AUDIT_LOGS`.
- **CORS Configuration:** Pre-configured for Angular frontend (`http://localhost:4200`).

---

## 2. Running Locally

### Development Profile (H2 Oracle Mode):
When Oracle is offline, run using the `dev` profile (active by default):
```bash
./mvnw clean spring-boot:run
```
Or with custom Maven:
```bash
mvn clean spring-boot:run -Dspring-boot.run.profiles=dev
```

### Oracle Production Profile:
When Oracle DB is running (e.g. on port 1521):
```bash
export ORACLE_URL=jdbc:oracle:thin:@localhost:1521/FREEPDB1
export ORACLE_USERNAME=careconnect
export ORACLE_PASSWORD=careconnect_pass
export JWT_SECRET=your_secure_256_bit_secret_key_here

mvn clean spring-boot:run -Dspring-boot.run.profiles=oracle
```

---

## 3. Core REST Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/v1/health` | GET | Public | Health status & environment diagnostics |
| `/api/v1/auth/login` | POST | Public | Authenticate with email/password; returns JWT |
| `/api/v1/auth/register` | POST | Public | Self-registration for new patients |
| `/api/v1/auth/me` | GET | Authenticated | Current authenticated user profile |
| `/api/v1/doctors` | GET | Authenticated | Search & filter active physicians |
| `/api/v1/patients` | GET | Admin / Triage | Master patient directory |
| `/api/v1/appointments` | GET / POST | Authenticated | Schedule or review appointments |
| `/api/v1/admin/audit-logs` | GET | Super Admin | Audit trail log inspection |
