-- ============================================================================
-- CareConnect360 Telemedicine Platform (Project ID: P_013)
-- Database: Oracle Database 19c / 21c / 23c Compatible
-- Script: 01_schema_ddl.sql
-- Description: Core Schema DDL with Sequences, Tables, Constraints & Indexes
-- Notice: Synthetic Demo Data Architecture. Server-side role authorization.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop existing tables and sequences if needed (Clean initialization order)
-- ----------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE clinical_audit_logs CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE payment_records CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE invoices CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE medical_documents CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE prescription_items CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE prescriptions CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE consultation_records CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE appointments CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE doctor_availability CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE doctor_profiles CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE patient_profiles CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE users CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- ----------------------------------------------------------------------------
-- 1. USERS: Central authentication and credential store
-- Note: Passwords must always be stored as salted BCrypt hashes.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id             NUMBER(19)          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               VARCHAR2(255)       NOT NULL,
    password_hash       VARCHAR2(255)       NOT NULL,
    first_name          VARCHAR2(100)       NOT NULL,
    last_name           VARCHAR2(100)       NOT NULL,
    phone_number        VARCHAR2(25),
    role                VARCHAR2(30)        DEFAULT 'ROLE_PATIENT' NOT NULL,
    is_active           NUMBER(1)           DEFAULT 1 NOT NULL,
    mfa_enabled         NUMBER(1)           DEFAULT 0 NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_TRIAGE')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0, 1)),
    CONSTRAINT chk_users_mfa CHECK (mfa_enabled IN (0, 1))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2. PATIENT_PROFILES: Medical Record Number (MRN) & Demographic Metadata
-- ----------------------------------------------------------------------------
CREATE TABLE patient_profiles (
    patient_id              NUMBER(19)      PRIMARY KEY,
    mrn                     VARCHAR2(50)    NOT NULL,
    date_of_birth           DATE            NOT NULL,
    gender                  VARCHAR2(20),
    blood_group             VARCHAR2(10),
    emergency_contact_name  VARCHAR2(150),
    emergency_contact_phone VARCHAR2(25),
    insurance_provider      VARCHAR2(150),
    insurance_policy_number VARCHAR2(100),
    house_flat_number       VARCHAR2(150),
    street_locality         VARCHAR2(255),
    landmark                VARCHAR2(150),
    city                    VARCHAR2(100),
    district                VARCHAR2(100),
    state_ut                VARCHAR2(100),
    pin_code                VARCHAR2(10),
    country                 VARCHAR2(100)   DEFAULT 'India',
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_patient_user FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uk_patient_mrn UNIQUE (mrn)
);

CREATE INDEX idx_patient_mrn ON patient_profiles(mrn);

-- ----------------------------------------------------------------------------
-- 3. DOCTOR_PROFILES: National Provider Identifier (NPI), Specialties & Rates
-- ----------------------------------------------------------------------------
CREATE TABLE doctor_profiles (
    doctor_id               NUMBER(19)      PRIMARY KEY,
    npi                     VARCHAR2(10)    NOT NULL,
    specialty               VARCHAR2(100)   NOT NULL,
    sub_specialty           VARCHAR2(100),
    license_number          VARCHAR2(50)    NOT NULL,
    consultation_fee        NUMBER(10,2)    DEFAULT 150.00 NOT NULL,
    experience_years        NUMBER(3)       DEFAULT 5 NOT NULL,
    bio                     CLOB,
    average_rating          NUMBER(3,2)     DEFAULT 5.00 NOT NULL,
    total_reviews           NUMBER(6)       DEFAULT 0 NOT NULL,
    is_accepting_patients   NUMBER(1)       DEFAULT 1 NOT NULL,
    is_synthetic            NUMBER(1)       DEFAULT 0 NOT NULL,
    credentialing_status    VARCHAR2(30)    DEFAULT 'APPROVED' NOT NULL,
    license_state           VARCHAR2(10)    DEFAULT 'MA',
    board_certifications    VARCHAR2(255),
    license_expiry_date     DATE,
    rejection_reason        VARCHAR2(500),
    verified_at             TIMESTAMP WITH TIME ZONE,
    verified_by             NUMBER(19),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_doctor_user FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uk_doctor_npi UNIQUE (npi),
    CONSTRAINT chk_doctor_accepting CHECK (is_accepting_patients IN (0, 1)),
    CONSTRAINT chk_doctor_synthetic CHECK (is_synthetic IN (0, 1)),
    CONSTRAINT chk_doctor_credentialing CHECK (credentialing_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'))
);

CREATE INDEX idx_doctor_specialty ON doctor_profiles(specialty);
CREATE INDEX idx_doctor_npi ON doctor_profiles(npi);
CREATE INDEX idx_doctor_cred_status ON doctor_profiles(credentialing_status);

-- ----------------------------------------------------------------------------
-- 4. DOCTOR_AVAILABILITY: Recurring weekly scheduling slots & working hours
-- ----------------------------------------------------------------------------
CREATE TABLE doctor_availability (
    availability_id         NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id               NUMBER(19)      NOT NULL,
    day_of_week             VARCHAR2(10)    NOT NULL,
    start_time              VARCHAR2(8)     NOT NULL, -- Format: '09:00:00'
    end_time                VARCHAR2(8)     NOT NULL, -- Format: '17:00:00'
    slot_duration_minutes   NUMBER(3)       DEFAULT 30 NOT NULL,
    is_active               NUMBER(1)       DEFAULT 1 NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_avail_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(doctor_id) ON DELETE CASCADE,
    CONSTRAINT chk_avail_day CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    CONSTRAINT chk_avail_active CHECK (is_active IN (0, 1))
);

CREATE INDEX idx_avail_doc_day ON doctor_availability(doctor_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 5. APPOINTMENTS: Clinical encounters & telehealth scheduling
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id          NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    encounter_number        VARCHAR2(50)    NOT NULL,
    patient_id              NUMBER(19)      NOT NULL,
    doctor_id               NUMBER(19)      NOT NULL,
    scheduled_time          TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes        NUMBER(3)       DEFAULT 30 NOT NULL,
    modality                VARCHAR2(20)    DEFAULT 'VIDEO' NOT NULL,
    status                  VARCHAR2(20)    DEFAULT 'SCHEDULED' NOT NULL,
    chief_complaint         VARCHAR2(500),
    cancellation_reason     VARCHAR2(500),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_appointment_enc UNIQUE (encounter_number),
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(patient_id),
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(doctor_id),
    CONSTRAINT chk_appt_modality CHECK (modality IN ('VIDEO', 'AUDIO', 'IN_PERSON')),
    CONSTRAINT chk_appt_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'))
);

CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_doctor ON appointments(doctor_id);
CREATE INDEX idx_appt_status ON appointments(status);
CREATE INDEX idx_appt_time ON appointments(scheduled_time);

-- ----------------------------------------------------------------------------
-- 6. CONSULTATION_RECORDS: Telemetry biometrics & clinical notes
-- ----------------------------------------------------------------------------
CREATE TABLE consultation_records (
    consultation_id         NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id          NUMBER(19)      NOT NULL,
    doctor_notes            CLOB,
    diagnosis_code          VARCHAR2(50),   -- ICD-10 code format
    diagnosis_description   VARCHAR2(255),
    systolic_bp             NUMBER(3),      -- mmHg
    diastolic_bp            NUMBER(3),      -- mmHg
    heart_rate_bpm          NUMBER(3),      -- bpm
    spo2_percent            NUMBER(3),      -- %
    vitals_provenance       VARCHAR2(30)    DEFAULT 'NOT_RECORDED' NOT NULL,
    session_started_at      TIMESTAMP WITH TIME ZONE,
    session_ended_at        TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_consult_appt UNIQUE (appointment_id),
    CONSTRAINT fk_consult_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    CONSTRAINT chk_vitals_provenance CHECK (vitals_provenance IN ('MEASURED', 'PATIENT_REPORTED', 'NOT_RECORDED'))
);

-- ----------------------------------------------------------------------------
-- 7. PRESCRIPTIONS: Electronic prescription master records
-- ----------------------------------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id         NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prescription_number     VARCHAR2(50)    NOT NULL,
    appointment_id          NUMBER(19)      NOT NULL,
    patient_id              NUMBER(19)      NOT NULL,
    doctor_id               NUMBER(19)      NOT NULL,
    issue_date              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status                  VARCHAR2(20)    DEFAULT 'ACTIVE' NOT NULL,
    pharmacy_name           VARCHAR2(150),
    clinical_notes          VARCHAR2(1000),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_rx_number UNIQUE (prescription_number),
    CONSTRAINT fk_rx_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
    CONSTRAINT fk_rx_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(patient_id),
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(doctor_id),
    CONSTRAINT chk_rx_status CHECK (status IN ('ACTIVE', 'DISPENSED', 'EXPIRED', 'CANCELLED'))
);

CREATE INDEX idx_rx_patient ON prescriptions(patient_id);
CREATE INDEX idx_rx_doctor ON prescriptions(doctor_id);

-- ----------------------------------------------------------------------------
-- 8. PRESCRIPTION_ITEMS: Itemized medications, dosages & refills
-- ----------------------------------------------------------------------------
CREATE TABLE prescription_items (
    item_id                 NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prescription_id         NUMBER(19)      NOT NULL,
    medication_name         VARCHAR2(150)   NOT NULL,
    dosage                  VARCHAR2(100)   NOT NULL,
    frequency               VARCHAR2(100)   NOT NULL,
    duration_days           NUMBER(4)       NOT NULL,
    refills_allowed         NUMBER(2)       DEFAULT 0 NOT NULL,
    instructions            VARCHAR2(500),
    CONSTRAINT fk_rx_item_parent FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
);

CREATE INDEX idx_rx_items_rx ON prescription_items(prescription_id);

-- ----------------------------------------------------------------------------
-- 9. MEDICAL_DOCUMENTS: EHR health records metadata
-- ----------------------------------------------------------------------------
CREATE TABLE medical_documents (
    document_id             NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id              NUMBER(19)      NOT NULL,
    uploaded_by             NUMBER(19)      NOT NULL,
    document_title          VARCHAR2(200)   NOT NULL,
    category                VARCHAR2(50)    NOT NULL,
    file_name               VARCHAR2(255)   NOT NULL,
    mime_type               VARCHAR2(100)   NOT NULL,
    file_size_bytes         NUMBER(19)      NOT NULL,
    storage_uri             VARCHAR2(500)   NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_doc_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(patient_id),
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    CONSTRAINT chk_doc_category CHECK (category IN ('LAB_REPORT', 'RADIOLOGY', 'CLINICAL_NOTE', 'DISCHARGE_SUMMARY', 'IMMUNIZATION'))
);

CREATE INDEX idx_doc_patient ON medical_documents(patient_id);

-- ----------------------------------------------------------------------------
-- 10. INVOICES: Patient billing, copays & insurance coverage
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    invoice_id              NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number          VARCHAR2(50)    NOT NULL,
    appointment_id          NUMBER(19)      NOT NULL,
    patient_id              NUMBER(19)      NOT NULL,
    total_amount            NUMBER(10,2)    NOT NULL,
    insurance_covered_amount NUMBER(10,2)   DEFAULT 0.00 NOT NULL,
    patient_copay_amount    NUMBER(10,2)    NOT NULL,
    status                  VARCHAR2(20)    DEFAULT 'PENDING' NOT NULL,
    due_date                DATE            NOT NULL,
    paid_at                 TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_invoice_num UNIQUE (invoice_number),
    CONSTRAINT fk_inv_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
    CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(patient_id),
    CONSTRAINT chk_inv_status CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'))
);

CREATE INDEX idx_inv_patient ON invoices(patient_id);
CREATE INDEX idx_inv_status ON invoices(status);

-- ----------------------------------------------------------------------------
-- 11. PAYMENT_RECORDS: Itemized payment transactions
-- ----------------------------------------------------------------------------
CREATE TABLE payment_records (
    payment_id              NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id              NUMBER(19)      NOT NULL,
    transaction_reference   VARCHAR2(100)   NOT NULL,
    amount_paid             NUMBER(10,2)    NOT NULL,
    payment_method          VARCHAR2(50)    NOT NULL,
    payment_status          VARCHAR2(20)    DEFAULT 'SUCCESS' NOT NULL,
    processed_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_pay_ref UNIQUE (transaction_reference),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    CONSTRAINT chk_pay_method CHECK (payment_method IN ('CREDIT_CARD', 'HSA_FSA', 'INSURANCE_CLAIM', 'BANK_TRANSFER')),
    CONSTRAINT chk_pay_status CHECK (payment_status IN ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'))
);

CREATE INDEX idx_pay_invoice ON payment_records(invoice_id);

-- ----------------------------------------------------------------------------
-- 12. CLINICAL_AUDIT_LOGS: Level-4 Clinical Audit Trail (Append-Only Event Store)
-- ----------------------------------------------------------------------------
CREATE TABLE clinical_audit_logs (
    audit_event_id          NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_tracking_code     VARCHAR2(100)   NOT NULL,
    actor_id                NUMBER(19)      NOT NULL,
    actor_role              VARCHAR2(50)    NOT NULL,
    action_type             VARCHAR2(100)   NOT NULL,
    target_resource         VARCHAR2(255)   NOT NULL,
    event_status            VARCHAR2(20)    DEFAULT 'SUCCESS' NOT NULL,
    details_json            CLOB,
    verification_hash       VARCHAR2(64)    NOT NULL, -- SHA-256 Checksum
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_audit_code UNIQUE (event_tracking_code),
    CONSTRAINT chk_audit_status CHECK (event_status IN ('SUCCESS', 'FAILED', 'WARNING'))
);

CREATE INDEX idx_audit_actor ON clinical_audit_logs(actor_id);
CREATE INDEX idx_audit_action ON clinical_audit_logs(action_type);
CREATE INDEX idx_audit_time ON clinical_audit_logs(created_at);
-- ----------------------------------------------------------------------------
-- 13. NOTIFICATIONS: In-app user notifications and clinical alerts
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id         NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                 NUMBER(19)      NOT NULL,
    category                VARCHAR2(30)    NOT NULL,
    title                   VARCHAR2(200)   NOT NULL,
    message                 VARCHAR2(1000)  NOT NULL,
    reference_code          VARCHAR2(100),
    badge_text              VARCHAR2(50),
    badge_severity          VARCHAR2(20)    DEFAULT 'info' NOT NULL,
    action_link             VARCHAR2(255),
    action_label            VARCHAR2(50),
    is_read                 NUMBER(1)       DEFAULT 0 NOT NULL,
    read_at                 TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_notif_cat CHECK (category IN ('APPOINTMENT', 'PRESCRIPTION', 'RECORDS', 'SECURITY')),
    CONSTRAINT chk_notif_read CHECK (is_read IN (0, 1))
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at);

COMMIT;
