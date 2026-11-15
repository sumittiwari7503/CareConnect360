package com.careconnect360.dto;

import java.time.Instant;
import java.util.List;

public record PrescriptionDto(
    Long id,
    String prescriptionNumber,
    Long appointmentId,
    String encounterNumber,
    Long patientId,
    String patientName,
    Long doctorId,
    String doctorName,
    String doctorSpecialty,
    Instant issueDate,
    String status,
    String pharmacyName,
    String clinicalNotes,
    List<PrescriptionItemDto> items,
    Instant createdAt
) {}
