package com.careconnect360.repository;

import com.careconnect360.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    Optional<AuditEvent> findByEventTrackingCode(String code);
    List<AuditEvent> findTop100ByOrderByCreatedAtDesc();
    List<AuditEvent> findByActorIdOrderByCreatedAtDesc(Long actorId);
    List<AuditEvent> findByActionTypeOrderByCreatedAtDesc(String actionType);
}
