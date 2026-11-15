package com.careconnect360.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record RescheduleRequestDto(
        @NotNull Instant newScheduledTime,
        String reason
) {}
