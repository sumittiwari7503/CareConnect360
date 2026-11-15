package com.careconnect360.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record InvoiceDto(
    Long id,
    String invoiceNumber,
    Long appointmentId,
    String encounterNumber,
    Long patientId,
    String patientName,
    Long doctorId,
    String doctorName,
    String doctorSpecialty,
    BigDecimal totalAmount,
    BigDecimal insuranceCoveredAmount,
    BigDecimal patientCopayAmount,
    String status,
    LocalDate dueDate,
    Instant paidAt,
    List<PaymentRecordDto> paymentRecords,
    Instant createdAt
) {}
