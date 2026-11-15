-- ============================================================================
-- CareConnect360 (Project P_013) - Production Database Migration Script 04
-- Migration: Add IS_SYNTHETIC Column and Check Constraint to DOCTOR_PROFILES
-- Target: Oracle Database 19c / 21c / 23c Enterprise & Free Tier
-- Purpose: Ensures existing databases conform to JPA entity mapping and pass
--          Hibernate ddl-auto: validate without rebuilding schema from scratch.
-- ============================================================================

-- Step 1: Add IS_SYNTHETIC column if not present
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE doctor_profiles ADD (is_synthetic NUMBER(1) DEFAULT 0 NOT NULL)';
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

-- Step 2: Add check constraint ensuring column is strictly boolean (0 or 1)
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE doctor_profiles ADD CONSTRAINT chk_doctor_synthetic CHECK (is_synthetic IN (0, 1))';
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

-- Step 3: Classify existing known synthetic seed physicians (if seeded previously)
UPDATE doctor_profiles
SET is_synthetic = 1
WHERE doctor_id IN (
    SELECT user_id FROM users WHERE email IN (
        'elena.vance@example.com',
        'marcus.sterling@example.com',
        'rajesh.nair@example.com',
        'samantha.brooks@example.com'
    )
);

COMMIT;

COMMENT ON COLUMN doctor_profiles.is_synthetic IS 'Flag indicating whether the doctor profile is synthetic demo data (1) or a verified clinical provider (0). Synthetic doctors are excluded from production searches and booking.';
