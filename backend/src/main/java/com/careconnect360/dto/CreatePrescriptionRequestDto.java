package com.careconnect360.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreatePrescriptionRequestDto(
    @NotNull(message = "appointmentId is required")
    Long appointmentId,
    String pharmacyName,
    String clinicalNotes,
    @NotEmpty(message = "At least one prescription item is required")
    List<ItemRequest> items
) {
    public record ItemRequest(
        @NotNull(message = "medicationName is required")
        String medicationName,
        @NotNull(message = "dosage is required")
        String dosage,
        @NotNull(message = "frequency is required")
        String frequency,
        @NotNull(message = "durationDays is required")
        Integer durationDays,
        Integer refillsAllowed,
        String instructions
    ) {}
}
