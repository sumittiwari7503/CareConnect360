package com.careconnect360;

import com.careconnect360.entity.AuditEvent;
import com.careconnect360.service.AuditEventService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class CareConnect360ApplicationTests {

    @Autowired(required = false)
    private AuditEventService auditEventService;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Context loads successfully in dev profile")
    void contextLoads() {
        assertNotNull(passwordEncoder, "PasswordEncoder should be present in context");
    }

    @Test
    @DisplayName("Verify BCrypt password encoder does not use plaintext")
    void testPasswordEncoder() {
        String raw = "CareConnect360!";
        String encoded = passwordEncoder.encode(raw);
        assertNotEquals(raw, encoded);
        assertTrue(passwordEncoder.matches(raw, encoded));
    }

    @Test
    @DisplayName("Verify audit event hashing mechanism")
    void testAuditEventRecording() {
        if (auditEventService != null) {
            AuditEvent event = auditEventService.recordEvent(
                    1L,
                    "ROLE_ADMIN",
                    "SECURITY_TEST",
                    "SYSTEM:CORE",
                    "SUCCESS",
                    "{\"test\":\"true\"}"
            );
            assertNotNull(event.getId());
            assertNotNull(event.getVerificationHash());
            assertEquals(64, event.getVerificationHash().length(), "SHA-256 hash should be 64 hex characters");
        }
    }
}
