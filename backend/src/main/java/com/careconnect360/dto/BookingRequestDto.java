package com.careconnect360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record BookingRequestDto(
        @NotNull Long doctorId,
        @NotNull Instant scheduledTime,
        Integer durationMinutes,
        @NotBlank String modality, // 'VIDEO', 'AUDIO', 'IN_PERSON'
        @NotBlank String chiefComplaint,
        String symptomsDuration,
        String medicalNotes,
        String emergencyContactName,
        String emergencyContactPhone
) {}
