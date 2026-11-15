-- ============================================================================
-- CareConnect360 (Project P_013) - Production Database Migration Script 05
-- Migration: Add VITALS_PROVENANCE Column and Check Constraint to CONSULTATION_RECORDS
-- Target: Oracle Database 19c / 21c / 23c Enterprise & Free Tier
-- Purpose: Ensures clinical integrity by capturing clinical data provenance
--          (MEASURED vs PATIENT_REPORTED vs NOT_RECORDED) for biometric readings.
-- ============================================================================

-- Step 1: Add VITALS_PROVENANCE column if not present
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE consultation_records ADD (vitals_provenance VARCHAR2(30) DEFAULT ''NOT_RECORDED'' NOT NULL)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -01430 THEN
            -- ORA-01430: column being added already exists in table
            NULL;
        ELSE
            RAISE;
        END IF;
END;
/

-- Step 2: Add check constraint ensuring column values strictly conform to clinical standards
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE consultation_records ADD CONSTRAINT chk_vitals_provenance CHECK (vitals_provenance IN (''MEASURED'', ''PATIENT_REPORTED'', ''NOT_RECORDED''))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -02264 THEN
            -- ORA-02264: name already used by an existing constraint
            NULL;
        ELSE
            RAISE;
        END IF;
END;
/

-- Step 3: Classify existing records: if readings exist, mark MEASURED; otherwise NOT_RECORDED
UPDATE consultation_records
SET vitals_provenance = CASE
    WHEN systolic_bp IS NOT NULL OR heart_rate_bpm IS NOT NULL THEN 'MEASURED'
    ELSE 'NOT_RECORDED'
END
WHERE vitals_provenance IS NULL OR vitals_provenance = 'NOT_RECORDED';

COMMIT;

COMMENT ON COLUMN consultation_records.vitals_provenance IS 'Clinical provenance of biometric readings: MEASURED (clinician-measured via calibrated device), PATIENT_REPORTED (stated by patient), or NOT_RECORDED.';
