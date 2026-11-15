package com.careconnect360.integration.eprescribe;

import java.time.Instant;

public record EPrescribingStatusResponse(
        String transmissionId,
        String statusCode,
        String statusDescription,
        Instant lastUpdated,
        boolean verifiedByPharmacy
) {}
