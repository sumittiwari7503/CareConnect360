package com.careconnect360.integration.payment;

import java.time.Instant;

public record PaymentGatewayResponse(
        boolean successful,
        String transactionReference,
        String authorizationCode,
        String responseCode,
        String message,
        Instant processedAt,
        String providerName,
        boolean liveMode
) {}
