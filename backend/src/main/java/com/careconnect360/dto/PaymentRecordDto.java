package com.careconnect360.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRecordDto(
    Long id,
    Long invoiceId,
    String invoiceNumber,
    String transactionReference,
    BigDecimal amountPaid,
    String paymentMethod,
    String paymentStatus,
    Instant processedAt
) {}
