package com.careconnect360.service;

import com.careconnect360.dto.AuditIntegrityReportDto;
import com.careconnect360.entity.AuditEvent;
import com.careconnect360.repository.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class AuditEventService {

    private final AuditEventRepository auditEventRepository;

    public AuditEventService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditEvent recordEvent(Long actorId, String actorRole, String actionType, String targetResource, String eventStatus, String detailsJson) {
        String trackingCode = "AUD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + actionType.substring(0, Math.min(3, actionType.length())).toUpperCase();
        Instant now = Instant.now();

        String rawData = trackingCode + "|" + actorId + "|" + actorRole + "|" + actionType + "|" + targetResource + "|" + eventStatus + "|" + now.toEpochMilli();
        String hash = computeSha256(rawData);

        AuditEvent event = new AuditEvent(
                trackingCode,
                actorId,
                actorRole,
                actionType,
                targetResource,
                eventStatus,
                detailsJson,
                hash
        );
        event.setCreatedAt(now);

        return auditEventRepository.save(event);
    }

    public List<AuditEvent> getRecentAuditLogs() {
        return auditEventRepository.findTop100ByOrderByCreatedAtDesc();
    }

    public List<AuditEvent> getFilteredAuditLogs(String actionType, String actorRole) {
        if (actionType != null && !actionType.isBlank() && actorRole != null && !actorRole.isBlank()) {
            return auditEventRepository.findTop100ByOrderByCreatedAtDesc().stream()
                    .filter(a -> a.getActionType().equalsIgnoreCase(actionType) && a.getActorRole().equalsIgnoreCase(actorRole))
                    .toList();
        } else if (actionType != null && !actionType.isBlank()) {
            return auditEventRepository.findByActionTypeOrderByCreatedAtDesc(actionType);
        } else if (actorRole != null && !actorRole.isBlank()) {
            return auditEventRepository.findTop100ByOrderByCreatedAtDesc().stream()
                    .filter(a -> a.getActorRole().equalsIgnoreCase(actorRole))
                    .toList();
        }
        return getRecentAuditLogs();
    }

    public AuditIntegrityReportDto verifyAuditLogIntegrity() {
        List<AuditEvent> all = auditEventRepository.findAll();
        long total = all.size();
        long verified = 0;
        long corrupted = 0;

        for (AuditEvent ev : all) {
            String rawData = ev.getEventTrackingCode() + "|" + ev.getActorId() + "|" + ev.getActorRole() + "|" + ev.getActionType() + "|" + ev.getTargetResource() + "|" + ev.getEventStatus() + "|" + ev.getCreatedAt().toEpochMilli();
            String expectedHash = computeSha256(rawData);
            if (expectedHash.equalsIgnoreCase(ev.getVerificationHash())) {
                verified++;
            } else {
                corrupted++;
            }
        }

        String status = corrupted == 0 ? "VERIFIED_TAMPER_FREE" : "INTEGRITY_VIOLATIONS_DETECTED";
        return new AuditIntegrityReportDto(total, verified, corrupted, status, Instant.now());
    }

    private String computeSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            return "HASH_UNAVAILABLE";
        }
    }
}
