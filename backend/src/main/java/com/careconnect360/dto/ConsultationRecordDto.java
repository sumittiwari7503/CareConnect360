package com.careconnect360.dto;

import java.time.Instant;

public record ConsultationRecordDto(
        Long id,
        Long appointmentId,
        String encounterNumber,
        String patientName,
        String patientMrn,
        String doctorName,
        String doctorNotes,
        String diagnosisCode,
        String diagnosisDescription,
        Integer systolicBp,
        Integer diastolicBp,
        Integer heartRateBpm,
        Integer spo2Percent,
        String vitalsProvenance,
        Instant sessionStartedAt,
        Instant sessionEndedAt,
        Instant createdAt
) {}
