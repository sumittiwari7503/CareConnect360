package com.careconnect360.admin;

import com.careconnect360.dto.AdminCreateDoctorRequestDto;
import com.careconnect360.dto.VerifyCredentialRequestDto;
import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import com.careconnect360.security.JwtTokenProvider;
import com.careconnect360.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AdminAndCredentialingIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String doctorToken;
    private String patientToken;
    private Long adminUserId;
    private Long testDoctorId;
    private Long testPatientUserId;

    @BeforeEach
    void setUp() {
        // Setup Admin User
        User admin = userRepository.findByEmail("admin.test@example.com").orElseGet(() ->
                userRepository.save(new User(
                        "admin.test@example.com",
                        passwordEncoder.encode("CareConnect360!"),
                        "Admin",
                        "Supervisor",
                        "+1-555-010-0010",
                        Role.ROLE_ADMIN
                ))
        );
        adminUserId = admin.getId();
        UserPrincipal adminPrincipal = UserPrincipal.create(admin);
        adminToken = jwtTokenProvider.generateToken(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(adminPrincipal, null, adminPrincipal.getAuthorities())
        );

        // Setup Test Doctor with PENDING credentialing
        User doctorUser = userRepository.findByEmail("doc.pending@example.com").orElseGet(() ->
                userRepository.save(new User(
                        "doc.pending@example.com",
                        passwordEncoder.encode("CareConnect360!"),
                        "Kiran",
                        "Patel",
                        "+1-555-010-0020",
                        Role.ROLE_DOCTOR
                ))
        );
        UserPrincipal doctorPrincipal = UserPrincipal.create(doctorUser);
        doctorToken = jwtTokenProvider.generateToken(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(doctorPrincipal, null, doctorPrincipal.getAuthorities())
        );

        DoctorProfile docProfile = doctorProfileRepository.findById(doctorUser.getId()).orElseGet(() -> {
            DoctorProfile dp = new DoctorProfile(
                    doctorUser,
                    "9876543210",
                    "Cardiology",
                    "LIC-CARD-9921",
                    BigDecimal.valueOf(175.00),
                    10
            );
            dp.setCredentialingStatus("PENDING");
            dp.setLicenseState("MA");
            dp.setBoardCertifications("American Board of Cardiology");
            return doctorProfileRepository.save(dp);
        });
        testDoctorId = docProfile.getId();

        // Setup Test Patient
        User patientUser = userRepository.findByEmail("patient.test@example.com").orElseGet(() ->
                userRepository.save(new User(
                        "patient.test@example.com",
                        passwordEncoder.encode("CareConnect360!"),
                        "Rohan",
                        "Verma",
                        "+91-9876543212",
                        Role.ROLE_PATIENT
                ))
        );
        testPatientUserId = patientUser.getId();
        UserPrincipal patientPrincipal = UserPrincipal.create(patientUser);
        patientToken = jwtTokenProvider.generateToken(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(patientPrincipal, null, patientPrincipal.getAuthorities())
        );

        if (!patientProfileRepository.existsById(testPatientUserId)) {
            PatientProfile pProfile = new PatientProfile(
                    patientUser,
                    "MRN-TEST-1234",
                    java.time.LocalDate.of(1990, 5, 12),
                    "Male",
                    "O+"
            );
            pProfile.setEmergencyContactName("Emergency Contact");
            pProfile.setEmergencyContactPhone("+1-555-010-0031");
            pProfile.setInsuranceProvider("BlueCross");
            pProfile.setInsurancePolicyNumber("BC-123");
            patientProfileRepository.save(pProfile);
        }
    }

    @Test
    @DisplayName("Admin can view platform telemetry and operational metrics")
    void adminCanViewPlatformMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registeredPatients", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.systemUptimePercent", is(99.98)))
                .andExpect(jsonPath("$.totalAuditEvents", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("Admin can view provider credentialing queue")
    void adminCanViewCredentialingQueue() throws Exception {
        mockMvc.perform(get("/api/v1/admin/credentialing-queue")
                        .param("status", "PENDING")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].credentialingStatus", is("PENDING")));
    }

    @Test
    @DisplayName("Admin can approve provider credentials with audit logging")
    void adminCanApproveDoctorCredentials() throws Exception {
        VerifyCredentialRequestDto req = new VerifyCredentialRequestDto("APPROVE", "Board license verified via state API");

        mockMvc.perform(post("/api/v1/admin/doctors/" + testDoctorId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentialingStatus", is("APPROVED")))
                .andExpect(jsonPath("$.verifiedByName", notNullValue()));

        DoctorProfile updated = doctorProfileRepository.findById(testDoctorId).orElseThrow();
        assertEquals("APPROVED", updated.getCredentialingStatus());
        assertNotNull(updated.getVerifiedAt());
        assertEquals(adminUserId, updated.getVerifiedBy());
    }

    @Test
    @DisplayName("Admin can reject provider credentials with mandatory reason")
    void adminCanRejectDoctorCredentialsWithReason() throws Exception {
        VerifyCredentialRequestDto req = new VerifyCredentialRequestDto("REJECT", "State medical board disciplinary notice on file");

        mockMvc.perform(post("/api/v1/admin/doctors/" + testDoctorId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentialingStatus", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", containsString("State medical board")));

        DoctorProfile updated = doctorProfileRepository.findById(testDoctorId).orElseThrow();
        assertEquals("REJECTED", updated.getCredentialingStatus());
    }

    @Test
    @DisplayName("Admin rejection without reason is rejected by validation")
    void adminRejectionWithoutReasonIsRejected() throws Exception {
        VerifyCredentialRequestDto req = new VerifyCredentialRequestDto("REJECT", "");

        mockMvc.perform(post("/api/v1/admin/doctors/" + testDoctorId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Admin can suspend and subsequently reactivate provider credentials")
    void adminCanSuspendAndReactivateDoctor() throws Exception {
        // 1. Suspend
        VerifyCredentialRequestDto suspendReq = new VerifyCredentialRequestDto("SUSPEND", "Temporary license renewal audit pending");
        mockMvc.perform(post("/api/v1/admin/doctors/" + testDoctorId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentialingStatus", is("SUSPENDED")));

        // 2. Reactivate
        VerifyCredentialRequestDto reactivateReq = new VerifyCredentialRequestDto("REACTIVATE", "License audit cleared");
        mockMvc.perform(post("/api/v1/admin/doctors/" + testDoctorId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reactivateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentialingStatus", is("APPROVED")));
    }

    @Test
    @DisplayName("Patient is forbidden from accessing administrative endpoints")
    void patientCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Physician is forbidden from accessing administrative endpoints")
    void doctorCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to admin endpoint is rejected")
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can lock and unlock a user account for identity governance")
    void adminCanLockAndUnlockUserAccount() throws Exception {
        // Lock user account
        mockMvc.perform(patch("/api/v1/admin/users/" + testPatientUserId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false, "reason", "Suspected compromised session"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));

        User locked = userRepository.findById(testPatientUserId).orElseThrow();
        assertFalse(locked.isActive());

        // Unlock user account
        mockMvc.perform(patch("/api/v1/admin/users/" + testPatientUserId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", true, "reason", "Identity re-verified via MFA"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(true)));

        User unlocked = userRepository.findById(testPatientUserId).orElseThrow();
        assertTrue(unlocked.isActive());
    }

    @Test
    @DisplayName("Admin cannot lock or deactivate their own active administrative account")
    void adminCannotLockTheirOwnAccount() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/" + adminUserId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false, "reason", "Self lockout test"))))
                .andExpect(status().isConflict());

        User adminUser = userRepository.findById(adminUserId).orElseThrow();
        assertTrue(adminUser.isActive());
    }

    @Test
    @DisplayName("Admin can verify cryptographic SHA-256 integrity of system audit ledger")
    void adminCanVerifyAuditIntegrity() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs/verify-integrity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.corruptedEvents", is(0)))
                .andExpect(jsonPath("$.integrityStatus", is("VERIFIED_TAMPER_FREE")));
    }

    @Test
    @DisplayName("Admin can onboard new physician with license and NPI registration")
    void adminCanOnboardDoctor() throws Exception {
        AdminCreateDoctorRequestDto newDoc = new AdminCreateDoctorRequestDto(
                "dr.newprovider@example.com",
                "CareConnect360!",
                "Alexander",
                "Wright",
                "+1-555-010-0088",
                "1558291044",
                "Neurology",
                "Cognitive Disorders",
                "LIC-NEUR-7788",
                "NY",
                BigDecimal.valueOf(200.00),
                12,
                "American Board of Psychiatry and Neurology",
                "Clinical specialist in cognitive health and virtual neurology.",
                true
        );

        mockMvc.perform(post("/api/v1/admin/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDoc)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.npi", is("1558291044")))
                .andExpect(jsonPath("$.credentialingStatus", is("APPROVED")));
    }
}
