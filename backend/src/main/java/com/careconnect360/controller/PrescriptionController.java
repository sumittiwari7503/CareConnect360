package com.careconnect360.controller;

import com.careconnect360.dto.CreatePrescriptionRequestDto;
import com.careconnect360.dto.PrescriptionDto;
import com.careconnect360.entity.User;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final UserRepository userRepository;

    public PrescriptionController(PrescriptionService prescriptionService, UserRepository userRepository) {
        this.prescriptionService = prescriptionService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<PrescriptionDto> createPrescription(
            @Valid @RequestBody CreatePrescriptionRequestDto request,
            Authentication auth
    ) {
        User user = getUser(auth);
        String role = user.getRole().name();
        PrescriptionDto created = prescriptionService.createPrescription(user.getId(), role, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsForPatient(
            @PathVariable Long patientId,
            Authentication auth
    ) {
        User user = getUser(auth);
        List<PrescriptionDto> list = prescriptionService.getPrescriptionsForPatient(patientId, user.getId(), user.getRole().name());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsForDoctor(
            @PathVariable Long doctorId,
            Authentication auth
    ) {
        User user = getUser(auth);
        List<PrescriptionDto> list = prescriptionService.getPrescriptionsForDoctor(doctorId, user.getId(), user.getRole().name());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionDto> getPrescriptionById(
            @PathVariable Long id,
            Authentication auth
    ) {
        User user = getUser(auth);
        PrescriptionDto rx = prescriptionService.getPrescriptionById(id, user.getId(), user.getRole().name());
        return ResponseEntity.ok(rx);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<PrescriptionDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        User user = getUser(auth);
        String newStatus = body.getOrDefault("status", "ACTIVE");
        PrescriptionDto updated = prescriptionService.updatePrescriptionStatus(id, newStatus, user.getId(), user.getRole().name());
        return ResponseEntity.ok(updated);
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + auth.getName()));
    }
}
