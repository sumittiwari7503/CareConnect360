package com.careconnect360.dto;

import java.time.Instant;

public record NotificationDto(
        Long id,
        Long userId,
        String category,
        String title,
        String message,
        String referenceCode,
        String badgeText,
        String badgeSeverity,
        String actionLink,
        String actionLabel,
        boolean isRead,
        Instant readAt,
        Instant createdAt
) {}
