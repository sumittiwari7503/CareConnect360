package com.careconnect360.service;

import com.careconnect360.dto.NotificationDto;
import com.careconnect360.dto.UnreadCountDto;
import com.careconnect360.entity.Notification;
import com.careconnect360.entity.User;
import com.careconnect360.exception.ResourceNotFoundException;
import com.careconnect360.repository.NotificationRepository;
import com.careconnect360.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuditEventService auditEventService;

    @org.springframework.beans.factory.annotation.Value("${app.demo.enabled:true}")
    private boolean demoModeEnabled = true;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            AuditEventService auditEventService
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.auditEventService = auditEventService;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId, String category) {
        List<Notification> notifications;
        if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category.trim())) {
            notifications = notificationRepository.findByUserIdAndCategoryIgnoreCaseOrderByCreatedAtDesc(userId, category.trim());
        } else {
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }

        return notifications.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnreadCountDto getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return new UnreadCountDto(count);
    }

    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You cannot modify notifications belonging to another user.");
        }

        notification.setRead(true);
        notification.setReadAt(Instant.now());
        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadForUser(userId, Instant.now());
    }

    public int clearReadNotifications(Long userId) {
        int deleted = notificationRepository.deleteAllReadForUser(userId);
        auditEventService.recordEvent(
                userId,
                "USER",
                "NOTIFICATIONS_CLEARED",
                "USER:" + userId,
                "SUCCESS",
                String.format("{\"clearedCount\":%d}", deleted)
        );
        return deleted;
    }

    public NotificationDto createNotification(
            Long userId,
            String category,
            String title,
            String message,
            String referenceCode,
            String badgeText,
            String badgeSeverity,
            String actionLink,
            String actionLabel
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Notification notification = new Notification(
                user,
                category.toUpperCase(),
                title,
                message,
                referenceCode,
                badgeText,
                badgeSeverity,
                actionLink,
                actionLabel
        );

        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    public void seedDemoNotifications(Long userId) {
        if (!demoModeEnabled) {
            throw new IllegalStateException("Demo notification seeding is disabled in production environments.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        seedInitialNotifications(user);
    }

    public void seedInitialNotifications(User user) {
        Notification n1 = new Notification(
                user,
                "APPOINTMENT",
                "Telehealth Room Opens in 30 Minutes",
                "Your scheduled virtual consultation begins at the scheduled encounter time. Audio, microphone, and encrypted video diagnostics check is strongly recommended prior to physician entry.",
                "ENCOUNTER #APT-2026-9021",
                "Live Room Soon",
                "urgent",
                "/telehealth/1",
                "Join Waiting Room"
        );
        n1.setRead(false);

        Notification n2 = new Notification(
                user,
                "PRESCRIPTION",
                "Prescription Renewal Approved & Transmitted",
                "Your attending physician approved your maintenance medication refill. Transmitted securely to your designated fulfillment pharmacy.",
                "RX-99401-2026",
                "Active Rx",
                "primary",
                "/prescriptions",
                "View Electronic Rx"
        );
        n2.setRead(false);

        Notification n3 = new Notification(
                user,
                "RECORDS",
                "Laboratory Diagnostic Panel Ready",
                "Diagnostic clinical lab report filed and digitally signed by your attending physician. Results are now available in your health records vault.",
                "LAB-DOC-84920",
                "Clinical Labs",
                "info",
                "/documents",
                "Review Lab Results"
        );
        n3.setRead(false);

        Notification n4 = new Notification(
                user,
                "SECURITY",
                "New Telehealth Login Device Detected",
                "Your CareConnect360 account was accessed from a verified session. If this was not you, lock your credentials immediately.",
                "SEC-LOG-4491",
                "Security Alert",
                "warning",
                "/settings",
                "Review Activity"
        );
        n4.setRead(true);
        n4.setReadAt(Instant.now().minusSeconds(86400));

        Notification n5 = new Notification(
                user,
                "APPOINTMENT",
                "Post-Consultation Care Summary Available",
                "Encounter summary for your clinical consultation visit is ready. Includes documented vital metrics, clinical guidance, and diagnostic notes.",
                "ENCOUNTER #APT-2026-8819",
                "Summary Ready",
                "info",
                "/appointments",
                "View Care Summary"
        );
        n5.setRead(true);
        n5.setReadAt(Instant.now().minusSeconds(172800));

        notificationRepository.save(n1);
        notificationRepository.save(n2);
        notificationRepository.save(n3);
        notificationRepository.save(n4);
        notificationRepository.save(n5);
    }

    private NotificationDto mapToDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getUser().getId(),
                n.getCategory(),
                n.getTitle(),
                n.getMessage(),
                n.getReferenceCode(),
                n.getBadgeText(),
                n.getBadgeSeverity(),
                n.getActionLink(),
                n.getActionLabel(),
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
