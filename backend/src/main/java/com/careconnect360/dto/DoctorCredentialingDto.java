package com.careconnect360.dto;

import java.time.Instant;
import java.time.LocalDate;

public record DoctorCredentialingDto(
        Long doctorId,
        String fullName,
        String email,
        String phone,
        String npi,
        String specialty,
        String subSpecialty,
        String licenseNumber,
        String licenseState,
        String boardCertifications,
        String credentialingStatus,
        LocalDate licenseExpiryDate,
        String rejectionReason,
        Instant verifiedAt,
        Long verifiedBy,
        String verifiedByName,
        Instant submittedAt,
        boolean active
) {}
