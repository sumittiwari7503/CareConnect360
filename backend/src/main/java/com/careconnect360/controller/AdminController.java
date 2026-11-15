package com.careconnect360.controller;

import com.careconnect360.dto.*;
import com.careconnect360.security.UserPrincipal;
import com.careconnect360.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsDto> getMetrics() {
        return ResponseEntity.ok(adminService.getPlatformMetrics());
    }

    @GetMapping("/credentialing-queue")
    public ResponseEntity<List<DoctorCredentialingDto>> getCredentialingQueue(
            @RequestParam(required = false, defaultValue = "ALL") String status
    ) {
        return ResponseEntity.ok(adminService.getCredentialingQueue(status));
    }

    @PostMapping("/doctors/{id}/verify-credentials")
    public ResponseEntity<DoctorCredentialingDto> verifyDoctorCredentials(
            @PathVariable Long id,
            @Valid @RequestBody VerifyCredentialRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(adminService.verifyDoctorCredentials(id, request, principal.getId(), role));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<AdminUserSummaryDto>> getDoctors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(adminService.getAllDoctors(search, status));
    }

    @PostMapping("/doctors")
    public ResponseEntity<DoctorCredentialingDto> onboardDoctor(
            @Valid @RequestBody AdminCreateDoctorRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.onboardDoctor(request, principal.getId(), role));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<AdminUserSummaryDto>> getPatients(
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(adminService.getAllPatients(search));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserSummaryDto> toggleUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean active = Boolean.parseBoolean(String.valueOf(body.getOrDefault("active", true)));
        String reason = (String) body.getOrDefault("reason", "Admin state update");
        String role = principal.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(adminService.toggleUserStatus(id, active, reason, principal.getId(), role));
    }
}
