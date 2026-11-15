package com.careconnect360.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AppointmentDto(
        Long id,
        String encounterNumber,
        Long patientId,
        String patientName,
        String patientMrn,
        Long doctorId,
        String doctorName,
        String doctorSpecialty,
        String doctorNpi,
        BigDecimal consultationFee,
        Instant scheduledTime,
        Integer durationMinutes,
        String modality,
        String status,
        String chiefComplaint,
        String cancellationReason,
        Instant createdAt
) {}
