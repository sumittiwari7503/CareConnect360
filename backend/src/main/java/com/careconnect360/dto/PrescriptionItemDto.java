package com.careconnect360.dto;

public record PrescriptionItemDto(
    Long id,
    String medicationName,
    String dosage,
    String frequency,
    Integer durationDays,
    Integer refillsAllowed,
    String instructions
) {}
