-- ============================================================================
-- CareConnect360 Telemedicine Platform (Project ID: P_013)
-- Database: Oracle Database 19c / 21c / 23c Compatible
-- Script: 03_audit_triggers.sql
-- Description: Oracle Database Triggers to Enforce Immutability on Audit Logs
-- Notice: Clinical audit logs are append-only. UPDATE and DELETE are prohibited.
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_clinical_audit_immutability
BEFORE UPDATE OR DELETE ON clinical_audit_logs
FOR EACH ROW
BEGIN
    RAISE_APPLICATION_ERROR(-20001, 'SECURITY ALERT: clinical_audit_logs is an immutable append-only ledger. Modifying or deleting audit entries is strictly forbidden.');
END;
/

-- Trigger to auto-update updated_at timestamp on users
CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger to auto-update updated_at timestamp on patient_profiles
CREATE OR REPLACE TRIGGER trg_patient_updated_at
BEFORE UPDATE ON patient_profiles
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger to auto-update updated_at timestamp on doctor_profiles
CREATE OR REPLACE TRIGGER trg_doctor_updated_at
BEFORE UPDATE ON doctor_profiles
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger to auto-update updated_at timestamp on appointments
CREATE OR REPLACE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

COMMIT;
