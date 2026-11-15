package com.careconnect360.controller;

import com.careconnect360.dto.NotificationDto;
import com.careconnect360.dto.UnreadCountDto;
import com.careconnect360.security.UserPrincipal;
import com.careconnect360.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.getUserNotifications(principal.getId(), category));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountDto> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getId()));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        int updated = notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read", "updatedCount", updated));
    }

    @DeleteMapping("/clear-read")
    public ResponseEntity<Map<String, Object>> clearReadNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        int cleared = notificationService.clearReadNotifications(principal.getId());
        return ResponseEntity.ok(Map.of("message", "Read notifications cleared", "clearedCount", cleared));
    }
}
