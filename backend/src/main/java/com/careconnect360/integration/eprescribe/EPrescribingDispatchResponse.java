package com.careconnect360.integration.eprescribe;

import java.time.Instant;

public record EPrescribingDispatchResponse(
        boolean dispatched,
        String transmissionId,
        String ncpdpMessageId,
        String pharmacyNpi,
        String pharmacyName,
        String statusCode,
        String statusDescription,
        Instant transmittedAt,
        String gatewayName,
        boolean liveMode
) {}
