package com.careconnect360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompleteConsultationRequestDto(
        @NotBlank(message = "Clinical doctor notes cannot be empty.")
        @Size(max = 5000, message = "Doctor notes exceed maximum allowed length of 5000 characters.")
        String doctorNotes,

        @Size(max = 50, message = "Diagnosis code cannot exceed 50 characters.")
        String diagnosisCode,

        @Size(max = 255, message = "Diagnosis description cannot exceed 255 characters.")
        String diagnosisDescription,

        Integer systolicBp,
        Integer diastolicBp,
        Integer heartRateBpm,
        Integer spo2Percent,

        @Size(max = 30, message = "Vitals provenance cannot exceed 30 characters.")
        String vitalsProvenance
) {
    public CompleteConsultationRequestDto(
            String doctorNotes,
            String diagnosisCode,
            String diagnosisDescription,
            Integer systolicBp,
            Integer diastolicBp,
            Integer heartRateBpm,
            Integer spo2Percent
    ) {
        this(doctorNotes, diagnosisCode, diagnosisDescription, systolicBp, diastolicBp, heartRateBpm, spo2Percent,
                (systolicBp != null || diastolicBp != null || heartRateBpm != null || spo2Percent != null) ? "MEASURED" : "NOT_RECORDED");
    }
}
