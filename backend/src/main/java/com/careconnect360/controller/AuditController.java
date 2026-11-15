package com.careconnect360.controller;

import com.careconnect360.dto.AuditIntegrityReportDto;
import com.careconnect360.entity.AuditEvent;
import com.careconnect360.service.AuditEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditEventService auditEventService;

    public AuditController(AuditEventService auditEventService) {
        this.auditEventService = auditEventService;
    }

    @GetMapping
    public ResponseEntity<List<AuditEvent>> getAuditLogs(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actorRole
    ) {
        return ResponseEntity.ok(auditEventService.getFilteredAuditLogs(actionType, actorRole));
    }

    @GetMapping("/verify-integrity")
    public ResponseEntity<AuditIntegrityReportDto> verifyAuditIntegrity() {
        return ResponseEntity.ok(auditEventService.verifyAuditLogIntegrity());
    }
}
