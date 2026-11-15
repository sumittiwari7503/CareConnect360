package com.careconnect360.dto;

import java.math.BigDecimal;
import java.util.List;

public record DoctorDto(
        Long id,
        String fullName,
        String email,
        String phone,
        String npi,
        String specialty,
        String subSpecialty,
        String licenseNumber,
        BigDecimal consultationFee,
        Integer experienceYears,
        String bio,
        BigDecimal averageRating,
        Integer totalReviews,
        boolean acceptingPatients,
        String nextAvailableSlot,
        List<AvailabilitySlotDto> weeklyAvailability,
        boolean isSynthetic
) {
    public record AvailabilitySlotDto(
            Long id,
            String dayOfWeek,
            String startTime,
            String endTime,
            Integer slotDurationMinutes
    ) {}
}
