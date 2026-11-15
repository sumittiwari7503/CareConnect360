package com.careconnect360.dto;

import java.time.Instant;

public record AuditIntegrityReportDto(
        long totalEventsChecked,
        long verifiedIntactEvents,
        long corruptedEvents,
        String integrityStatus,
        Instant verifiedAt
) {}
