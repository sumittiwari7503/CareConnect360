package com.careconnect360.dto;

import java.time.Instant;

public record AdminUserSummaryDto(
        Long userId,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String phoneNumber,
        String role,
        boolean active,
        boolean mfaEnabled,
        Instant createdAt,
        String mrn,
        String npi,
        String specialty,
        String insuranceProvider,
        String emergencyContactName
) {}
