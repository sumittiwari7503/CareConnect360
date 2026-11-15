-- ============================================================================
-- CareConnect360 Telemedicine Platform (Project ID: P_013)
-- Database: Oracle Database 19c / 21c / 23c Compatible
-- Script: 02_seed_demo_data.sql
-- Description: Synthetic Seed Data for Development & Testing (India Localized)
-- CRITICAL ENVIRONMENT ISOLATION NOTICE:
-- This script contains strictly simulated demo data (test personas & mock records).
-- DO NOT EXECUTE ON PRODUCTION OR STAGING SERVERS.
-- All simulated doctors are explicitly marked with IS_SYNTHETIC = 1.
-- Default Demo Password for all accounts: 'CareConnect360!'
-- BCrypt Hash: '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W'
-- ============================================================================

-- 1. SEED USERS
-- Admin: Priya Sundaram
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('priya.sundaram@careconnect360.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Priya', 'Sundaram', '+91-9876543201', 'ROLE_ADMIN', 1, 1);

-- Doctor 1: Dr. Rajesh Nair (Cardiology)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('dr.rajesh.nair@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Rajesh', 'Nair', '+91-9876543202', 'ROLE_DOCTOR', 1, 1);

-- Doctor 2: Dr. Priya Patel (Internal Medicine)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('dr.priya.patel@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Priya', 'Patel', '+91-9876543203', 'ROLE_DOCTOR', 1, 1);

-- Patient 1: Aarav Sharma
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('aarav.sharma@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Aarav', 'Sharma', '+91-9876543210', 'ROLE_PATIENT', 1, 1);

-- Patient 2: Rohan Verma (Demo Patient)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('rohan.verma@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Rohan', 'Verma', '+91-9876543212', 'ROLE_PATIENT', 1, 0);

-- Triage Nurse: Kavita Reddy
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('kavita.reddy@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Kavita', 'Reddy', '+91-9876543206', 'ROLE_TRIAGE', 1, 0);

-- Doctor 3: Dr. Ananya Sharma (Pediatrics)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('dr.ananya.sharma@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Ananya', 'Sharma', '+91-9876543204', 'ROLE_DOCTOR', 1, 1);

-- Doctor 4 (Pending Credentialing): Dr. Vikram Malhotra (Neurology)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, is_active, mfa_enabled)
VALUES ('dr.vikram.malhotra@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.f0j/k9lE9tqO7uD3WkUfNnC1oK3w7W', 'Vikram', 'Malhotra', '+91-9876543205', 'ROLE_DOCTOR', 1, 0);

-- 2. SEED DOCTOR PROFILES
-- Dr. Rajesh Nair (Cardiology) - user_id 2
INSERT INTO doctor_profiles (doctor_id, npi, specialty, sub_specialty, license_number, consultation_fee, experience_years, bio, average_rating, total_reviews, is_accepting_patients, credentialing_status, license_state, board_certifications, is_synthetic)
VALUES (2, '1928374601', 'Cardiology', 'Interventional Cardiology', 'MMC-CARD-88391', 1500.00, 14, '[DEMO CREDENTIAL] Senior Consultant Cardiologist with clinical fellowship at AIIMS. Specializing in preventive cardiac care, clinical telemetry, and hypertension management.', 4.95, 128, 1, 'APPROVED', 'MMC', 'MBBS, MD (General Medicine), DM (Cardiology) - AIIMS New Delhi', 1);

-- Dr. Priya Patel (Internal Medicine) - user_id 3
INSERT INTO doctor_profiles (doctor_id, npi, specialty, sub_specialty, license_number, consultation_fee, experience_years, bio, average_rating, total_reviews, is_accepting_patients, credentialing_status, license_state, board_certifications, is_synthetic)
VALUES (3, '1092837401', 'Internal Medicine', 'Preventive Health', 'KMC-MED-99201', 800.00, 11, '[DEMO CREDENTIAL] Specializing in adult comprehensive primary care, chronic condition monitoring, and telemetry-guided virtual consults across India.', 4.91, 214, 1, 'APPROVED', 'KMC', 'MBBS, MD (Internal Medicine) - Kasturba Medical College, Manipal', 1);

-- Dr. Ananya Sharma (Pediatrics) - user_id 7
INSERT INTO doctor_profiles (doctor_id, npi, specialty, sub_specialty, license_number, consultation_fee, experience_years, bio, average_rating, total_reviews, is_accepting_patients, credentialing_status, license_state, board_certifications, is_synthetic)
VALUES (7, '1394820101', 'Pediatrics', 'Pediatric Critical Care', 'DMC-PED-44912', 1000.00, 9, '[DEMO CREDENTIAL] Senior Pediatrician specializing in infant development, childhood immunizations, and virtual pediatric guidance.', 4.98, 89, 1, 'APPROVED', 'DMC', 'MBBS, MD (Pediatrics) - PGIMER Chandigarh', 1);

-- Dr. Vikram Malhotra (Neurology - Pending Credentialing) - user_id 8
INSERT INTO doctor_profiles (doctor_id, npi, specialty, sub_specialty, license_number, consultation_fee, experience_years, bio, average_rating, total_reviews, is_accepting_patients, credentialing_status, license_state, board_certifications, is_synthetic)
VALUES (8, '1489201901', 'Neurology', 'Clinical Neurophysiology', 'MMC-NEUR-49210', 1800.00, 16, '[DEMO CREDENTIAL] AIIMS & NIMHANS Fellow. Specializing in neuromuscular disorders, stroke recovery, and clinical neurophysiology.', 5.00, 0, 1, 'PENDING', 'MMC', 'MBBS, MD (Medicine), DM (Neurology) - NIMHANS Bengaluru', 1);

-- 3. SEED PATIENT PROFILES
-- Aarav Sharma - user_id 4
INSERT INTO patient_profiles (patient_id, mrn, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_policy_number, house_flat_number, street_locality, landmark, city, district, state_ut, pin_code, country)
VALUES (4, 'MRN-IND-849204', TO_DATE('1992-08-15', 'YYYY-MM-DD'), 'Male', 'O+', 'Sunita Sharma', '+91-9876543211', 'Star Health Comprehensive Insurance', 'STAR-IND-9948201', 'Flat 402, Block B, Prestige Palms', '14th Main, 5th Cross, Indiranagar', 'Near BDA Complex', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560038', 'India');

-- Rohan Verma - user_id 5
INSERT INTO patient_profiles (patient_id, mrn, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_policy_number, house_flat_number, street_locality, landmark, city, district, state_ut, pin_code, country)
VALUES (5, 'MRN-IND-551029', TO_DATE('1985-11-23', 'YYYY-MM-DD'), 'Male', 'B+', 'Meera Verma', '+91-9876543213', 'HDFC ERGO Health Insurance', 'HDFC-IND-1102948', 'B-12, Sector 15', 'Ring Road, Rohini', 'Near Metro Station', 'New Delhi', 'North West Delhi', 'Delhi (NCT)', '110085', 'India');

-- 4. SEED DOCTOR AVAILABILITY
-- Dr. Priya Patel (Mon, Wed, Fri: 09:00 - 17:00 IST)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES (3, 'MONDAY', '09:00:00', '17:00:00', 30, 1);
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES (3, 'WEDNESDAY', '09:00:00', '17:00:00', 30, 1);
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES (3, 'FRIDAY', '09:00:00', '16:00:00', 30, 1);

-- Dr. Rajesh Nair (Tue, Thu: 10:00 - 18:00 IST)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES (2, 'TUESDAY', '10:00:00', '18:00:00', 45, 1);
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES (2, 'THURSDAY', '10:00:00', '18:00:00', 45, 1);

-- 5. SEED APPOINTMENTS
-- Appointment 1: Encounter with Dr. Priya Patel (General Medicine)
INSERT INTO appointments (encounter_number, patient_id, doctor_id, scheduled_time, duration_minutes, modality, status, chief_complaint)
VALUES ('APT-2026-9104', 4, 3, TIMESTAMP '2026-11-13 14:30:00 UTC', 30, 'VIDEO', 'CONFIRMED', 'Quarterly hypertension checkup and review of recent telemetry readings');

-- Appointment 2: Cardiology Specialist Follow-up with Dr. Rajesh Nair
INSERT INTO appointments (encounter_number, patient_id, doctor_id, scheduled_time, duration_minutes, modality, status, chief_complaint)
VALUES ('APT-2026-3950', 4, 2, TIMESTAMP '2026-11-14 10:00:00 UTC', 45, 'VIDEO', 'CONFIRMED', 'Specialist Cardiology consultation and Holter monitor review');

-- Appointment 3: Completed consultation for Rohan Verma
INSERT INTO appointments (encounter_number, patient_id, doctor_id, scheduled_time, duration_minutes, modality, status, chief_complaint)
VALUES ('APT-2026-8841', 5, 3, TIMESTAMP '2026-10-20 11:00:00 UTC', 30, 'VIDEO', 'COMPLETED', 'Persistent dry cough and mild respiratory discomfort');

-- 6. SEED CONSULTATION RECORDS
INSERT INTO consultation_records (appointment_id, doctor_notes, diagnosis_code, diagnosis_description, systolic_bp, diastolic_bp, heart_rate_bpm, spo2_percent, vitals_provenance, session_started_at, session_ended_at)
VALUES (3, 'Patient presented with mild respiratory symptoms. Telemetry indicated stable SpO2 at 98%. Recommended hydration, humidification and follow-up if symptoms persist.', 'J06.9', 'Acute upper respiratory infection, unspecified', 122, 78, 72, 98, 'MEASURED', TIMESTAMP '2026-10-20 11:02:10 UTC', TIMESTAMP '2026-10-20 11:29:45 UTC');

-- 7. SEED PRESCRIPTIONS
INSERT INTO prescriptions (prescription_number, appointment_id, patient_id, doctor_id, issue_date, status, pharmacy_name, clinical_notes)
VALUES ('RX-2026-48210', 3, 4, 3, TIMESTAMP '2026-10-20 11:30:00 UTC', 'ACTIVE', 'Apollo Pharmacy #1042 • Indiranagar 100ft Road, Bengaluru', 'Take medications consistently with morning meals. Monitor BP weekly.');

INSERT INTO prescription_items (prescription_id, medication_name, dosage, frequency, duration_days, refills_allowed, instructions)
VALUES (1, 'Telmisartan', '40mg oral tablet', 'Once daily in the morning', 90, 3, 'Take with water. Monitor blood pressure weekly.');

INSERT INTO prescription_items (prescription_id, medication_name, dosage, frequency, duration_days, refills_allowed, instructions)
VALUES (1, 'Atorvastatin', '20mg oral tablet', 'Once daily at bedtime', 90, 3, 'Take after dinner. Maintain low cholesterol diet.');

-- 8. SEED MEDICAL DOCUMENTS
INSERT INTO medical_documents (patient_id, uploaded_by, document_title, category, file_name, mime_type, file_size_bytes, storage_uri)
VALUES (4, 3, 'Comprehensive Metabolic Panel (CMP)', 'LAB_REPORT', 'CMP_Results_Nov2026.pdf', 'application/pdf', 342190, '/ehr-store/patients/849204/labs/cmp-2026-11.pdf');

INSERT INTO medical_documents (patient_id, uploaded_by, document_title, category, file_name, mime_type, file_size_bytes, storage_uri)
VALUES (4, 2, 'Electrocardiogram 12-Lead Report', 'RADIOLOGY', 'ECG_Tracing_Nov2026.pdf', 'application/pdf', 1248900, '/ehr-store/patients/849204/cardio/ecg-2026-11.pdf');

-- 9. SEED INVOICES & PAYMENTS (in INR ₹ with realistic doctor pricing)
-- Paid invoice for Appointment 1 (Dr. Priya Patel - ₹800 fee)
INSERT INTO invoices (invoice_number, appointment_id, patient_id, total_amount, insurance_covered_amount, patient_copay_amount, status, due_date, paid_at)
VALUES ('INV-2026-9104', 1, 4, 800.00, 640.00, 160.00, 'PAID', TO_DATE('2026-11-30', 'YYYY-MM-DD'), TIMESTAMP '2026-11-01 09:15:00 UTC');

INSERT INTO payment_records (invoice_id, transaction_reference, amount_paid, payment_method, payment_status, processed_at)
VALUES (1, 'TXN-UPI-9948201-OKHDFC', 160.00, 'UPI', 'SUCCESS', TIMESTAMP '2026-11-01 09:15:22 UTC');

-- Pending invoice for Appointment 2 (Dr. Rajesh Nair - ₹1,500 fee, patient copay ₹300)
INSERT INTO invoices (invoice_number, appointment_id, patient_id, total_amount, insurance_covered_amount, patient_copay_amount, status, due_date)
VALUES ('INV-2026-3950', 2, 4, 1500.00, 1200.00, 300.00, 'PENDING', TO_DATE('2026-11-30', 'YYYY-MM-DD'));

-- 10. SEED CLINICAL AUDIT LOGS (Level-4 Clinical Audit Trail)
INSERT INTO clinical_audit_logs (event_tracking_code, actor_id, actor_role, action_type, target_resource, event_status, details_json, verification_hash)
VALUES ('AUD-90241-EXP', 1, 'ROLE_ADMIN', 'PHI_RECORD_EXPORT', 'PATIENT:MRN-IND-849204', 'SUCCESS', '{"scope":"AUDIT_DOWNLOAD","filter":"ALL_ENCOUNTERS","ipAddress":"192.168.1.104"}', 'a7f5e82b4c109d3e8a9f24c5b6e7d8a9f0e1d2c3b4a596877e6d5c4b3a210987');

INSERT INTO clinical_audit_logs (event_tracking_code, actor_id, actor_role, action_type, target_resource, event_status, details_json, verification_hash)
VALUES ('AUD-90240-SEC', 4, 'ROLE_PATIENT', 'USER_LOGIN_MFA', 'USER:aarav.sharma@example.com', 'SUCCESS', '{"method":"TOTP","deviceId":"iPhone15,2","location":"India-South (Bengaluru)"}', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

INSERT INTO clinical_audit_logs (event_tracking_code, actor_id, actor_role, action_type, target_resource, event_status, details_json, verification_hash)
VALUES ('AUD-90239-MED', 3, 'ROLE_DOCTOR', 'PRESCRIPTION_ISSUED', 'RX:RX-2026-48210', 'SUCCESS', '{"medications":["Telmisartan","Atorvastatin"],"pharmacy":"Apollo Pharmacy Indiranagar"}', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');

-- 11. SEED NOTIFICATIONS (Clinical Encounters, Prescriptions, Labs, Security)
INSERT INTO notifications (user_id, category, title, message, reference_code, badge_text, badge_severity, action_link, action_label, is_read, created_at)
VALUES (4, 'APPOINTMENT', 'Telehealth Room Opens in 30 Minutes', 'Your scheduled virtual consultation with Dr. Priya Patel, MD begins at 02:30 PM IST. Encrypted audio, microphone, and video diagnostic check is recommended prior to consultation.', 'ENCOUNTER #APT-2026-9104', 'Live Room Soon', 'urgent', '/telehealth/1', 'Join Waiting Room', 0, TIMESTAMP '2026-11-13 14:00:00 UTC');

INSERT INTO notifications (user_id, category, title, message, reference_code, badge_text, badge_severity, action_link, action_label, is_read, created_at)
VALUES (4, 'PRESCRIPTION', 'Prescription Renewal Approved & Transmitted', 'Dr. Priya Patel approved your Telmisartan 40mg oral tablet refill (90-day supply with 3 refills). Transmitted securely to Apollo Pharmacy Indiranagar, Bengaluru.', 'RX-99401-2026', 'Active Rx', 'primary', '/prescriptions', 'View Electronic Rx', 0, TIMESTAMP '2026-11-13 08:30:00 UTC');

INSERT INTO notifications (user_id, category, title, message, reference_code, badge_text, badge_severity, action_link, action_label, is_read, created_at)
VALUES (4, 'RECORDS', 'Laboratory Diagnostic Panel Ready', 'Comprehensive Metabolic Panel (CMP) lab report filed and digitally signed by Dr. Priya Patel. Results are now available in your health records vault.', 'LAB-DOC-84920', 'Clinical Labs', 'info', '/documents', 'Review Lab Results', 0, TIMESTAMP '2026-11-12 14:15:00 UTC');

INSERT INTO notifications (user_id, category, title, message, reference_code, badge_text, badge_severity, action_link, action_label, is_read, created_at)
VALUES (4, 'SECURITY', 'New Telehealth Login Device Detected', 'Your CareConnect360 account was accessed from a verified session (macOS / Chrome in Bengaluru, Karnataka). If this was not you, lock your credentials immediately.', 'SEC-LOG-4491', 'Security Alert', 'warning', '/settings', 'Review Activity', 1, TIMESTAMP '2026-11-11 19:40:00 UTC');

INSERT INTO notifications (user_id, category, title, message, reference_code, badge_text, badge_severity, action_link, action_label, is_read, created_at)
VALUES (4, 'APPOINTMENT', 'Post-Consultation Care Summary Available', 'Encounter summary for your visit with Dr. Priya Patel is ready. Includes updated vital metrics, lifestyle guidance, and diagnostic notes.', 'ENCOUNTER #APT-2026-8819', 'Summary Ready', 'info', '/appointments/1', 'View Care Summary', 1, TIMESTAMP '2026-11-10 12:00:00 UTC');

COMMIT;
