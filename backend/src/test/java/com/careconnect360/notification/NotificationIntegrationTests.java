package com.careconnect360.notification;

import com.careconnect360.entity.Notification;
import com.careconnect360.entity.Role;
import com.careconnect360.entity.User;
import com.careconnect360.repository.NotificationRepository;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.security.JwtTokenProvider;
import com.careconnect360.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class NotificationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.careconnect360.service.NotificationService notificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User patientUser;
    private User otherUser;
    private String patientToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();

        patientUser = userRepository.findByEmail("notif.patient@example.com").orElseGet(() ->
                userRepository.save(new User(
                        "notif.patient@example.com",
                        passwordEncoder.encode("CareConnect360!"),
                        "Notif",
                        "Patient",
                        "+1-555-010-4401",
                        Role.ROLE_PATIENT
                ))
        );

        otherUser = userRepository.findByEmail("notif.other@example.com").orElseGet(() ->
                userRepository.save(new User(
                        "notif.other@example.com",
                        passwordEncoder.encode("CareConnect360!"),
                        "Other",
                        "User",
                        "+1-555-010-4402",
                        Role.ROLE_PATIENT
                ))
        );

        UserPrincipal patientPrincipal = UserPrincipal.create(patientUser);
        patientToken = jwtTokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(patientPrincipal, null, patientPrincipal.getAuthorities())
        );

        UserPrincipal otherPrincipal = UserPrincipal.create(otherUser);
        otherToken = jwtTokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(otherPrincipal, null, otherPrincipal.getAuthorities())
        );
    }

    @Test
    @DisplayName("Unauthenticated request to notifications endpoint is rejected")
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("New patient with no notifications returns empty list without silent auto-seeding")
    void newPatientReturnsEmptyListWithoutAutoSeeding() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(0)));
    }

    @Test
    @DisplayName("Patient can retrieve explicitly seeded demo notifications")
    void patientCanRetrieveTheirNotifications() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].title", notNullValue()))
                .andExpect(jsonPath("$[0].category", notNullValue()));
    }

    @Test
    @DisplayName("Filter notifications by category")
    void filterNotificationsByCategory() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        mockMvc.perform(get("/api/v1/notifications?category=APPOINTMENT")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].category", everyItem(is("APPOINTMENT"))));
    }

    @Test
    @DisplayName("Get unread notifications count reflects unread items")
    void getUnreadCountReflectsUnreadItems() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(3)));
    }

    @Test
    @DisplayName("Patient can mark a single unread notification as read")
    void patientCanMarkSingleNotificationAsRead() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        Notification unreadNotification = notificationRepository.findByUserIdOrderByCreatedAtDesc(patientUser.getId())
                .stream().filter(n -> !n.isRead()).findFirst().orElseThrow();

        mockMvc.perform(put("/api/v1/notifications/" + unreadNotification.getId() + "/read")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead", is(true)))
                .andExpect(jsonPath("$.readAt", notNullValue()));

        Notification refreshed = notificationRepository.findById(unreadNotification.getId()).orElseThrow();
        assertTrue(refreshed.isRead());
    }

    @Test
    @DisplayName("Unauthorized user cannot mark another user's notification as read (Access Denied)")
    void cannotMarkAnotherUsersNotificationAsRead() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        Notification patientNotif = notificationRepository.findByUserIdOrderByCreatedAtDesc(patientUser.getId()).get(0);

        // Other user attempts to mark it as read
        mockMvc.perform(put("/api/v1/notifications/" + patientNotif.getId() + "/read")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Mark all notifications as read updates all unread entries")
    void markAllAsReadSuccessfully() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        mockMvc.perform(put("/api/v1/notifications/mark-all-read")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount", is(3)));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(0)));
    }

    @Test
    @DisplayName("Clear read notifications removes read items leaving unread intact")
    void clearReadNotificationsRemovesReadEntries() throws Exception {
        notificationService.seedDemoNotifications(patientUser.getId());

        mockMvc.perform(delete("/api/v1/notifications/clear-read")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clearedCount", is(2)));

        long remaining = notificationRepository.findByUserIdOrderByCreatedAtDesc(patientUser.getId()).size();
        assertEquals(3, remaining);
    }
}
