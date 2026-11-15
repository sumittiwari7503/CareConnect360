package com.careconnect360.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminCreateDoctorRequestDto(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phoneNumber,
        @NotBlank String npi,
        @NotBlank String specialty,
        String subSpecialty,
        @NotBlank String licenseNumber,
        String licenseState,
        @NotNull BigDecimal consultationFee,
        Integer experienceYears,
        String boardCertifications,
        String bio,
        boolean autoApprove
) {}
