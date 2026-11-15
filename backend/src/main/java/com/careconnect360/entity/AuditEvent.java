package com.careconnect360.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "clinical_audit_logs")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_event_id")
    private Long id;

    @Column(name = "event_tracking_code", nullable = false, unique = true, length = 100)
    private String eventTrackingCode;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "actor_role", nullable = false, length = 50)
    private String actorRole;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "target_resource", nullable = false, length = 255)
    private String targetResource;

    @Column(name = "event_status", nullable = false, length = 20)
    private String eventStatus = "SUCCESS"; // 'SUCCESS', 'FAILED', 'WARNING'

    @Lob
    @Column(name = "details_json")
    private String detailsJson;

    @Column(name = "verification_hash", nullable = false, length = 64)
    private String verificationHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditEvent() {}

    public AuditEvent(String eventTrackingCode, Long actorId, String actorRole, String actionType, String targetResource, String eventStatus, String detailsJson, String verificationHash) {
        this.eventTrackingCode = eventTrackingCode;
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.actionType = actionType;
        this.targetResource = targetResource;
        this.eventStatus = eventStatus;
        this.detailsJson = detailsJson;
        this.verificationHash = verificationHash;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventTrackingCode() { return eventTrackingCode; }
    public void setEventTrackingCode(String eventTrackingCode) { this.eventTrackingCode = eventTrackingCode; }

    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }

    public String getEventStatus() { return eventStatus; }
    public void setEventStatus(String eventStatus) { this.eventStatus = eventStatus; }

    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }

    public String getVerificationHash() { return verificationHash; }
    public void setVerificationHash(String verificationHash) { this.verificationHash = verificationHash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
