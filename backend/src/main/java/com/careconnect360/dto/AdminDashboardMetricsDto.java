package com.careconnect360.dto;

import java.math.BigDecimal;

public record AdminDashboardMetricsDto(
        long registeredPatients,
        long credentialedPhysicians,
        long pendingCredentialing,
        long totalAppointments,
        long completedConsultations,
        BigDecimal totalPlatformRevenue,
        double systemUptimePercent,
        long totalAuditEvents
) {}
