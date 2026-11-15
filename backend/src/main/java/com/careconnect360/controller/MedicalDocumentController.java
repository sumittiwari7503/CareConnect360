package com.careconnect360.controller;

import com.careconnect360.dto.MedicalDocumentDto;
import com.careconnect360.entity.User;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.service.MedicalDocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
public class MedicalDocumentController {

    private final MedicalDocumentService documentService;
    private final UserRepository userRepository;

    public MedicalDocumentController(MedicalDocumentService documentService, UserRepository userRepository) {
        this.documentService = documentService;
        this.userRepository = userRepository;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MedicalDocumentDto> uploadDocument(
            @RequestParam("patientId") Long patientId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false, defaultValue = "LAB_REPORT") String category,
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) throws IOException {
        User user = getUser(auth);
        MedicalDocumentDto uploaded = documentService.uploadDocument(
                patientId,
                user.getId(),
                user.getRole().name(),
                title,
                category,
                file
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(uploaded);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MedicalDocumentDto>> getDocumentsForPatient(
            @PathVariable Long patientId,
            Authentication auth
    ) {
        User user = getUser(auth);
        List<MedicalDocumentDto> list = documentService.getDocumentsForPatient(patientId, user.getId(), user.getRole().name());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}/metadata")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MedicalDocumentDto> getDocumentMetadata(
            @PathVariable Long id,
            Authentication auth
    ) {
        User user = getUser(auth);
        MedicalDocumentDto dto = documentService.getDocumentMetadata(id, user.getId(), user.getRole().name());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            Authentication auth
    ) throws IOException {
        User user = getUser(auth);
        MedicalDocumentDto metadata = documentService.getDocumentMetadata(id, user.getId(), user.getRole().name());
        Resource resource = documentService.downloadDocument(id, user.getId(), user.getRole().name());

        String sanitizedFileName = metadata.fileName() != null
                ? metadata.fileName().replace("\r", "").replace("\n", "").replace("\"", "")
                : "document.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + sanitizedFileName + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication auth
    ) throws IOException {
        User user = getUser(auth);
        documentService.deleteDocument(id, user.getId(), user.getRole().name());
        return ResponseEntity.noContent().build();
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + auth.getName()));
    }
}
