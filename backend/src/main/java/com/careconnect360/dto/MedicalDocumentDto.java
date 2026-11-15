package com.careconnect360.dto;

import java.time.Instant;

public record MedicalDocumentDto(
    Long id,
    Long patientId,
    String patientName,
    Long uploadedById,
    String uploadedByName,
    String documentTitle,
    String category,
    String fileName,
    String mimeType,
    Long fileSizeBytes,
    Instant createdAt
) {}
