-- ============================================================================
-- CareConnect360 Telemedicine Platform (Project ID: P_013)
-- Database Migration: 06_migration_add_indian_address.sql
-- Description: Adds Indian address fields and defaults to PATIENT_PROFILES
-- Oracle 19c / 21c / 23c and H2 compatible
-- ============================================================================

ALTER TABLE patient_profiles ADD (
    house_flat_number       VARCHAR2(150),
    street_locality         VARCHAR2(255),
    landmark                VARCHAR2(150),
    city                    VARCHAR2(100),
    district                VARCHAR2(100),
    state_ut                VARCHAR2(100),
    pin_code                VARCHAR2(10),
    country                 VARCHAR2(100) DEFAULT 'India'
);

COMMENT ON COLUMN patient_profiles.house_flat_number IS 'House, Apartment or Flat number';
COMMENT ON COLUMN patient_profiles.street_locality IS 'Street name, sector, road, locality';
COMMENT ON COLUMN patient_profiles.landmark IS 'Nearby landmark';
COMMENT ON COLUMN patient_profiles.city IS 'City, Town or Village';
COMMENT ON COLUMN patient_profiles.district IS 'Revenue district in India';
COMMENT ON COLUMN patient_profiles.state_ut IS 'State or Union Territory of India (28 states + 8 UTs)';
COMMENT ON COLUMN patient_profiles.pin_code IS '6-digit Indian Postal PIN Code';
COMMENT ON COLUMN patient_profiles.country IS 'Country (defaults to India)';
