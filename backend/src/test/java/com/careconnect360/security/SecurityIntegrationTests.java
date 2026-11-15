package com.careconnect360.security;

import com.careconnect360.entity.Role;
import com.careconnect360.entity.User;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SecurityIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthService authService;

    private static final String DEMO_EMAIL = "security.test@example.com";
    private static final String DEMO_RAW_PASS = "ValidPassword123#";

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByEmail(DEMO_EMAIL)) {
            User testUser = new User(
                    DEMO_EMAIL,
                    passwordEncoder.encode(DEMO_RAW_PASS),
                    "Security",
                    "Tester",
                    "+1-555-010-9999",
                    Role.ROLE_PATIENT
            );
            userRepository.save(testUser);
        }
    }

    @Test
    @DisplayName("Security: Login success produces valid JWT token")
    void testLoginSuccess() {
        Map<String, Object> response = authService.authenticate(DEMO_EMAIL, DEMO_RAW_PASS);
        assertNotNull(response.get("token"));
        assertEquals("Bearer", response.get("tokenType"));
        assertEquals(DEMO_EMAIL, response.get("email"));
        assertEquals("ROLE_PATIENT", response.get("role"));
    }

    @Test
    @DisplayName("Security: Login failure on invalid password throws BadCredentialsException")
    void testLoginFailureInvalidPassword() {
        assertThrows(BadCredentialsException.class, () -> {
            authService.authenticate(DEMO_EMAIL, "WrongPassword!");
        });
    }

    @Test
    @DisplayName("Security: JWT signature validation and tampering detection")
    void testJwtValidationAndTampering() {
        Map<String, Object> response = authService.authenticate(DEMO_EMAIL, DEMO_RAW_PASS);
        String token = (String) response.get("token");

        // Valid token
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(DEMO_EMAIL, jwtTokenProvider.getUsernameFromJwt(token));

        // Tampered token
        String tampered = token.substring(0, token.length() - 6) + "XXXXXX";
        assertFalse(jwtTokenProvider.validateToken(tampered));
    }

    @Test
    @DisplayName("Security: Password hashing verification (BCrypt salt and match)")
    void testPasswordHashing() {
        User user = userRepository.findByEmail(DEMO_EMAIL).orElseThrow();
        String hash = user.getPasswordHash();

        assertNotEquals(DEMO_RAW_PASS, hash);
        assertTrue(hash.startsWith("$2a$") || hash.startsWith("$2b$"));
        assertTrue(passwordEncoder.matches(DEMO_RAW_PASS, hash));
        assertFalse(passwordEncoder.matches("IncorrectPass", hash));
    }

    @Test
    @DisplayName("Security: Unauthenticated request to protected endpoints is rejected (403/401)")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/api/v1/appointments"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Role-based authorization - Patient cannot access Admin audit logs")
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void testRoleBasedAccessPatientForbiddenOnAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Role-based authorization - Admin can access Admin audit logs")
    @WithMockUser(username = "admin@example.com", authorities = {"ROLE_ADMIN"})
    void testRoleBasedAccessAdminAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Security: Public health endpoint is accessible without authentication")
    void testPublicHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }
}
