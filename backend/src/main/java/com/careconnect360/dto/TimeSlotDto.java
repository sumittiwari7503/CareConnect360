package com.careconnect360.dto;

import java.time.Instant;

public record TimeSlotDto(
        Instant startTime,
        Instant endTime,
        String formattedTime, // e.g. "09:00 AM"
        boolean available,
        String conflictReason // null if available, or "BOOKED", "OUTSIDE_HOURS"
) {}
