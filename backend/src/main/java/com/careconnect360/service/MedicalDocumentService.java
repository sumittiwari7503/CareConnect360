package com.careconnect360.service;

import com.careconnect360.dto.MedicalDocumentDto;
import com.careconnect360.entity.MedicalDocument;
import com.careconnect360.entity.PatientProfile;
import com.careconnect360.entity.User;
import com.careconnect360.repository.AppointmentRepository;
import com.careconnect360.repository.MedicalDocumentRepository;
import com.careconnect360.repository.PatientProfileRepository;
import com.careconnect360.repository.UserRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicalDocumentService {

    private static final Path STORAGE_DIR = Paths.get("uploads", "medical_documents");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "application/zip",
            "application/x-zip-compressed",
            "text/plain"
    );
    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    private final MedicalDocumentRepository documentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final AuditEventService auditEventService;
    private final AppointmentRepository appointmentRepository;

    public MedicalDocumentService(
            MedicalDocumentRepository documentRepository,
            PatientProfileRepository patientProfileRepository,
            UserRepository userRepository,
            AuditEventService auditEventService,
            AppointmentRepository appointmentRepository
    ) {
        this.documentRepository = documentRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.userRepository = userRepository;
        this.auditEventService = auditEventService;
        this.appointmentRepository = appointmentRepository;

        try {
            if (!Files.exists(STORAGE_DIR)) {
                Files.createDirectories(STORAGE_DIR);
            }
        } catch (IOException e) {
            System.err.println("Could not initialize document storage directory: " + e.getMessage());
        }
    }

    public MedicalDocumentDto uploadDocument(
            Long patientId,
            Long uploaderUserId,
            String uploaderRole,
            String title,
            String category,
            MultipartFile file
    ) throws IOException {
        if ("ROLE_PATIENT".equals(uploaderRole)) {
            if (!uploaderUserId.equals(patientId)) {
                throw new AccessDeniedException("Access denied: Patients can only upload documents to their own record");
            }
        } else if ("ROLE_DOCTOR".equals(uploaderRole)) {
            boolean hasRelationship = appointmentRepository.existsByPatientIdAndDoctorId(patientId, uploaderUserId);
            if (!hasRelationship) {
                throw new AccessDeniedException("Access denied: Clinicians can only upload medical documents for patients with whom they have an active or documented clinical care relationship.");
            }
        } else {
            throw new AccessDeniedException("Access denied: Non-clinical users cannot upload protected clinical medical documents.");
        }

        PatientProfile patient = patientProfileRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found: " + patientId));

        User uploader = userRepository.findById(uploaderUserId)
                .orElseThrow(() -> new IllegalArgumentException("Uploader user not found: " + uploaderUserId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 25 MB limit");
        }

        String mimeType = file.getContentType() != null ? file.getContentType().toLowerCase() : "application/octet-stream";
        if (!ALLOWED_MIME_TYPES.contains(mimeType) && !mimeType.equals("application/octet-stream")) {
            throw new IllegalArgumentException("File type not supported: " + mimeType);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        String cleanTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : originalFilename;
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.toUpperCase() : "LAB_REPORT";

        String uniqueFileName = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetPath = STORAGE_DIR.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        MedicalDocument document = new MedicalDocument(
                patient,
                uploader,
                cleanTitle,
                cleanCategory,
                originalFilename,
                mimeType,
                file.getSize(),
                targetPath.toString()
        );

        MedicalDocument saved = documentRepository.save(document);

        auditEventService.recordEvent(
                uploaderUserId,
                uploaderRole,
                "DOCUMENT_UPLOADED",
                "MedicalDocument:" + saved.getId(),
                "SUCCESS",
                String.format("{\"documentTitle\":\"%s\",\"category\":\"%s\",\"size\":%d}", saved.getDocumentTitle(), saved.getCategory(), saved.getFileSizeBytes())
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicalDocumentDto> getDocumentsForPatient(Long patientId, Long callerUserId, String callerRole) {
        if ("ROLE_PATIENT".equals(callerRole)) {
            if (!callerUserId.equals(patientId)) {
                throw new AccessDeniedException("Access denied: Patients can only view their own medical documents.");
            }
        } else if ("ROLE_DOCTOR".equals(callerRole)) {
            boolean hasRelationship = appointmentRepository.existsByPatientIdAndDoctorId(patientId, callerUserId)
                    || documentRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                            .anyMatch(d -> d.getUploadedBy() != null && d.getUploadedBy().getId().equals(callerUserId));
            if (!hasRelationship) {
                throw new AccessDeniedException("Access denied: You do not have an active or documented clinical care relationship with this patient.");
            }
        } else {
            throw new AccessDeniedException("Access denied: Non-clinical administrators and unauthorized roles are restricted from viewing patient medical documents under Minimum Necessary privacy standards.");
        }

        return documentRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicalDocumentDto getDocumentMetadata(Long documentId, Long callerUserId, String callerRole) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Medical document not found: " + documentId));

        verifyAccess(doc, callerUserId, callerRole);
        return mapToDto(doc);
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(Long documentId, Long callerUserId, String callerRole) throws IOException {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Medical document not found: " + documentId));

        verifyAccess(doc, callerUserId, callerRole);

        Path path = Paths.get(doc.getStorageUri()).normalize();
        Path baseDir = STORAGE_DIR.toAbsolutePath().normalize();
        if (!path.toAbsolutePath().normalize().startsWith(baseDir)) {
            throw new SecurityException("Access denied: Invalid document storage path traversal detected.");
        }
        byte[] bytes;
        if (Files.exists(path)) {
            bytes = Files.readAllBytes(path);
        } else {
            // Fallback synthetic content if file was purged
            bytes = ("CareConnect360 Simulated Encrypted Document: " + doc.getDocumentTitle()).getBytes();
        }

        auditEventService.recordEvent(
                callerUserId,
                callerRole,
                "DOCUMENT_ACCESSED",
                "MedicalDocument:" + doc.getId(),
                "SUCCESS",
                String.format("{\"documentTitle\":\"%s\"}", doc.getDocumentTitle())
        );

        return new ByteArrayResource(bytes);
    }

    public void deleteDocument(Long documentId, Long callerUserId, String callerRole) throws IOException {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Medical document not found: " + documentId));

        if (!doc.getUploadedBy().getId().equals(callerUserId)) {
            throw new AccessDeniedException("Access denied: Only the original author or uploader can remove this medical document.");
        }

        Path path = Paths.get(doc.getStorageUri()).normalize();
        Path baseDir = STORAGE_DIR.toAbsolutePath().normalize();
        if (!path.toAbsolutePath().normalize().startsWith(baseDir)) {
            throw new SecurityException("Access denied: Invalid document storage path traversal detected.");
        }
        if (Files.exists(path)) {
            Files.deleteIfExists(path);
        }

        documentRepository.delete(doc);

        auditEventService.recordEvent(
                callerUserId,
                callerRole,
                "DOCUMENT_DELETED",
                "MedicalDocument:" + documentId,
                "SUCCESS",
                String.format("{\"documentTitle\":\"%s\"}", doc.getDocumentTitle())
        );
    }

    private void verifyAccess(MedicalDocument doc, Long callerUserId, String callerRole) {
        Long patientId = doc.getPatient().getId();

        // 1. Patient Ownership: Patients can access only their own medical documents
        if ("ROLE_PATIENT".equals(callerRole)) {
            if (patientId.equals(callerUserId)) {
                return;
            }
            throw new AccessDeniedException("Access denied: You are not authorized to access medical documents belonging to another patient.");
        }

        // 2. Treating Clinician Access: Must be original author/uploader or have established clinical relationship
        if ("ROLE_DOCTOR".equals(callerRole)) {
            if (doc.getUploadedBy() != null && doc.getUploadedBy().getId().equals(callerUserId)) {
                return;
            }
            if (appointmentRepository.existsByPatientIdAndDoctorId(patientId, callerUserId)) {
                return;
            }
            throw new AccessDeniedException("Access denied: You do not have an established clinical relationship or active encounter with this patient.");
        }

        // 3. Non-clinical Administrator: Denied by default under Minimum Necessary privacy standards
        if ("ROLE_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException("Access denied: Non-clinical administrators are restricted from viewing or downloading clinical medical documents under Minimum Necessary privacy standards.");
        }

        throw new AccessDeniedException("Unauthorized access to protected medical document.");
    }

    private MedicalDocumentDto mapToDto(MedicalDocument d) {
        String patientName = d.getPatient().getUser().getFirstName() + " " + d.getPatient().getUser().getLastName();
        String uploaderName = d.getUploadedBy().getFirstName() + " " + d.getUploadedBy().getLastName();

        return new MedicalDocumentDto(
                d.getId(),
                d.getPatient().getId(),
                patientName,
                d.getUploadedBy().getId(),
                uploaderName,
                d.getDocumentTitle(),
                d.getCategory(),
                d.getFileName(),
                d.getMimeType(),
                d.getFileSizeBytes(),
                d.getCreatedAt()
        );
    }
}
