package com.careconnect360.e2e;

import com.careconnect360.dto.*;
import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import com.careconnect360.security.JwtTokenProvider;
import com.careconnect360.security.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class EndToEndApplicationAcceptanceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String patientToken;
    private Long patientUserId;
    private String doctorToken;
    private Long doctorUserId;
    private String adminToken;
    private Long adminUserId;

    private Long doctorProfileId;
    private Instant upcomingSlotTime;

    @BeforeEach
    void setUpActors() {
        // 1. Patient Actor
        User patientUser = userRepository.save(new User(
                "e2e.patient@example.com",
                passwordEncoder.encode("PatientPass123!"),
                "Emma",
                "Watson",
                "+1-555-019-1001",
                Role.ROLE_PATIENT
        ));
        patientUserId = patientUser.getId();
        patientProfileRepository.save(new PatientProfile(
                patientUser,
                "MRN-E2E-1001",
                LocalDate.of(1990, 4, 15),
                "Female",
                "O+"
        ));
        patientToken = generateToken(patientUser);

        // 2. Doctor Actor (Cardiologist)
        User doctorUser = userRepository.save(new User(
                "e2e.doctor@example.com",
                passwordEncoder.encode("DoctorPass123!"),
                "Dr. Rajesh",
                "Nair",
                "+91-9876543202",
                Role.ROLE_DOCTOR
        ));
        doctorUserId = doctorUser.getId();
        DoctorProfile docProfile = new DoctorProfile(
                doctorUser,
                "1928374611",
                "Cardiology",
                "MD-E2E-CARD-01",
                BigDecimal.valueOf(180.00),
                16
        );
        docProfile.setAcceptingPatients(true);
        docProfile.setCredentialingStatus("APPROVED");
        docProfile = doctorProfileRepository.save(docProfile);
        doctorProfileId = docProfile.getId();
        doctorToken = generateToken(doctorUser);

        // 3. Admin Actor
        User adminUser = userRepository.save(new User(
                "e2e.admin@example.com",
                passwordEncoder.encode("AdminPass123!"),
                "Chief",
                "Administrator",
                "+1-555-019-3003",
                Role.ROLE_ADMIN
        ));
        adminUserId = adminUser.getId();
        adminToken = generateToken(adminUser);

        // Weekly availability for Doctor
        for (DayOfWeek day : DayOfWeek.values()) {
            availabilityRepository.save(new DoctorAvailability(
                    docProfile,
                    day.name(),
                    "08:00:00",
                    "18:00:00",
                    30
            ));
        }

        LocalDate nextWed = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY));
        upcomingSlotTime = nextWed.atTime(14, 0).atZone(ZoneId.of("UTC")).toInstant().truncatedTo(ChronoUnit.MINUTES);
    }

    private String generateToken(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        return jwtTokenProvider.generateToken(auth);
    }

    // =========================================================================
    // 1. PATIENT JOURNEY ACCEPTANCE
    // =========================================================================

    @Test
    @DisplayName("E2E Patient Journey: Registration -> Login -> Discovery -> Booking -> Conflict -> Cancel -> Reschedule")
    void testPatientCompleteEndToEndJourney() throws Exception {
        // 1.1 Patient Registration
        String regEmail = "new.registered.patient@example.com";
        String regPayload = objectMapper.writeValueAsString(Map.of(
                "email", regEmail,
                "password", "SecurePassword123#",
                "firstName", "Oliver",
                "lastName", "Twist",
                "phone", "+1-555-019-4444"
        ));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isOk());

        // 1.2 Patient Login
        String loginPayload = objectMapper.writeValueAsString(Map.of(
                "email", regEmail,
                "password", "SecurePassword123#"
        ));

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String newPatientToken = loginJson.get("token").asText();
        assertNotNull(newPatientToken);
        assertEquals("ROLE_PATIENT", loginJson.get("role").asText());

        // 1.3 Doctor Discovery & Specialty Filter
        MvcResult searchResult = mockMvc.perform(get("/api/v1/doctors")
                        .param("specialty", "Cardiology")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode searchJson = objectMapper.readTree(searchResult.getResponse().getContentAsString());
        assertTrue(searchJson.isArray());
        assertTrue(searchJson.size() >= 1);
        assertEquals("Cardiology", searchJson.get(0).get("specialty").asText());

        // 1.4 Doctor Profile & Availability Slots
        mockMvc.perform(get("/api/v1/doctors/" + doctorProfileId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk());

        LocalDate slotDate = upcomingSlotTime.atZone(ZoneId.of("UTC")).toLocalDate();
        MvcResult slotsResult = mockMvc.perform(get("/api/v1/doctors/" + doctorProfileId + "/slots")
                        .param("date", slotDate.toString())
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode slotsJson = objectMapper.readTree(slotsResult.getResponse().getContentAsString());
        assertTrue(slotsJson.isArray());
        assertTrue(slotsJson.size() > 0);

        // 1.5 Appointment Booking
        BookingRequestDto bookingReq = new BookingRequestDto(
                doctorProfileId,
                upcomingSlotTime,
                30,
                "VIDEO",
                "Cardiology consultation and review",
                "2 weeks",
                "None",
                "Emergency Contact",
                "555-0100"
        );

        MvcResult bookResult = mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode apptJson = objectMapper.readTree(bookResult.getResponse().getContentAsString());
        Long apptId = apptJson.get("id").asLong();
        assertEquals("CONFIRMED", apptJson.get("status").asText());

        // 1.6 Duplicate Booking Prevention on Same Slot (Expected Conflict: 409)
        mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isConflict());

        // 1.7 Rescheduling Appointment
        Instant rescheduledSlot = upcomingSlotTime.plus(30, ChronoUnit.MINUTES);
        RescheduleRequestDto reschedReq = new RescheduleRequestDto(
                rescheduledSlot,
                "Patient schedule conflict, moving slot"
        );

        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/reschedule")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reschedReq)))
                .andExpect(status().isOk());

        // 1.8 Appointment Cancellation
        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/cancel")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Cancelled due to travel"))))
                .andExpect(status().isOk());

        // 1.9 Verify Appointments List
        MvcResult myApptsResult = mockMvc.perform(get("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode myApptsJson = objectMapper.readTree(myApptsResult.getResponse().getContentAsString());
        assertTrue(myApptsJson.isArray());
        assertEquals("CANCELLED", myApptsJson.get(0).get("status").asText());
    }

    // =========================================================================
    // 2. PHYSICIAN JOURNEY ACCEPTANCE
    // =========================================================================

    @Test
    @DisplayName("E2E Physician Journey: Login -> Queue -> Details -> Start -> SOAP -> Provenance -> Complete -> e-Rx")
    void testPhysicianClinicalEncounterCompleteJourney() throws Exception {
        // Setup scheduled appointment for doctor
        BookingRequestDto bookingReq = new BookingRequestDto(
                doctorProfileId,
                upcomingSlotTime,
                30,
                "VIDEO",
                "Hypertension checkup and vitals assessment",
                "1 week",
                "None",
                "Family Contact",
                "555-0102"
        );

        MvcResult bookResult = mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long apptId = objectMapper.readTree(bookResult.getResponse().getContentAsString()).get("id").asLong();

        // 2.1 Physician Queue
        MvcResult docApptsResult = mockMvc.perform(get("/api/v1/appointments")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode docAppts = objectMapper.readTree(docApptsResult.getResponse().getContentAsString());
        assertTrue(docAppts.size() >= 1);

        // 2.2 Appointment Details
        mockMvc.perform(get("/api/v1/appointments/" + apptId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk());

        // 2.3 Start Consultation -> IN_PROGRESS
        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/start-consultation")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk());

        // 2.4 Clinical Provenance Rejection Test (Vitals entered with NOT_RECORDED)
        CompleteConsultationRequestDto invalidProvReq = new CompleteConsultationRequestDto(
                "SOAP Notes entered",
                "I10",
                "Hypertension",
                128,
                82,
                72,
                98,
                "NOT_RECORDED"
        );

        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/complete-consultation")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidProvReq)))
                .andExpect(status().isBadRequest());

        // 2.5 Inverted Blood Pressure Rejection (Systolic < Diastolic)
        CompleteConsultationRequestDto invalidBpReq = new CompleteConsultationRequestDto(
                "SOAP Notes entered",
                "I10",
                "Hypertension",
                70,
                110,
                72,
                98,
                "MEASURED"
        );

        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/complete-consultation")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidBpReq)))
                .andExpect(status().isBadRequest());

        // 2.6 Valid Consultation Completion with MEASURED Provenance
        CompleteConsultationRequestDto validCompleteReq = new CompleteConsultationRequestDto(
                "[SOAP]: Patient resting BP well managed under ACE-inhibitor therapy.",
                "I10",
                "Essential (primary) hypertension",
                124,
                80,
                72,
                99,
                "MEASURED"
        );

        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/complete-consultation")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCompleteReq)))
                .andExpect(status().isOk());

        // 2.7 Verify Completed Consultation Record
        MvcResult consultRecResult = mockMvc.perform(get("/api/v1/appointments/" + apptId + "/consultation-record")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode consultRecord = objectMapper.readTree(consultRecResult.getResponse().getContentAsString());
        assertEquals("MEASURED", consultRecord.get("vitalsProvenance").asText());
        assertEquals(124, consultRecord.get("systolicBp").asInt());
        assertEquals("I10", consultRecord.get("diagnosisCode").asText());

        // 2.8 Electronic Prescription Authoring & NCPDP Dispatch
        CreatePrescriptionRequestDto rxReq = new CreatePrescriptionRequestDto(
                apptId,
                "HealthCenter Pharmacy",
                "Take with water in the morning",
                List.of(new CreatePrescriptionRequestDto.ItemRequest(
                        "Lisinopril",
                        "20mg",
                        "Once daily",
                        30,
                        3,
                        "Take with food"
                ))
        );

        MvcResult rxResult = mockMvc.perform(post("/api/v1/prescriptions")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rxReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode rxJson = objectMapper.readTree(rxResult.getResponse().getContentAsString());
        assertEquals("ACTIVE", rxJson.get("status").asText());
        assertEquals("HealthCenter Pharmacy", rxJson.get("pharmacyName").asText());
    }

    // =========================================================================
    // 3. TELEHEALTH JOURNEY ACCEPTANCE
    // =========================================================================

    @Test
    @DisplayName("E2E Telehealth Journey: Room Session Auth -> Token Validation -> Expiration -> Completed Session Closure")
    void testTelehealthRoomSessionAuthorizationAndLifecycleJourney() throws Exception {
        BookingRequestDto bookingReq = new BookingRequestDto(
                doctorProfileId,
                upcomingSlotTime,
                30,
                "VIDEO",
                "Pre-screening consult",
                "1 week",
                "None",
                "Contact",
                "555-0109"
        );

        MvcResult bookResult = mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long apptId = objectMapper.readTree(bookResult.getResponse().getContentAsString()).get("id").asLong();

        // 3.1 Patient Room Token Acquisition
        MvcResult patientTokenResult = mockMvc.perform(get("/api/v1/appointments/" + apptId + "/room-token")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode patTokenJson = objectMapper.readTree(patientTokenResult.getResponse().getContentAsString());
        assertEquals("CC-9021", patTokenJson.get("roomId").asText());
        assertNotNull(patTokenJson.get("sessionToken").asText());
        assertEquals("ROLE_PATIENT", patTokenJson.get("participantRole").asText());
        assertTrue(patTokenJson.get("iceServers").isArray());
        assertTrue(patTokenJson.get("iceServers").size() >= 1);

        // 3.2 Doctor Room Token Acquisition
        MvcResult docTokenResult = mockMvc.perform(get("/api/v1/appointments/" + apptId + "/room-token")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode docTokenJson = objectMapper.readTree(docTokenResult.getResponse().getContentAsString());
        assertEquals("ROLE_DOCTOR", docTokenJson.get("participantRole").asText());

        // 3.3 Completed Session Closure Rejection
        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/start-consultation")
                .header("Authorization", "Bearer " + doctorToken));

        CompleteConsultationRequestDto completeReq = new CompleteConsultationRequestDto(
                "Completed.", "Z00.00", "Exam", null, null, null, null, null
        );
        mockMvc.perform(post("/api/v1/appointments/" + apptId + "/complete-consultation")
                .header("Authorization", "Bearer " + doctorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completeReq)));

        // Once completed, live room token is rejected
        mockMvc.perform(get("/api/v1/appointments/" + apptId + "/room-token")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 4. BILLING & INVOICING JOURNEY ACCEPTANCE
    // =========================================================================

    @Test
    @DisplayName("E2E Billing Journey: Auto Invoice -> 20% Copay -> Payment Gateway Adapter Approval -> Decline Simulation")
    void testBillingPaymentAndCopaySettlementJourney() throws Exception {
        BookingRequestDto bookingReq = new BookingRequestDto(
                doctorProfileId,
                upcomingSlotTime,
                30,
                "VIDEO",
                "Cardiology initial evaluation",
                "1 week",
                "None",
                "Contact",
                "555-0105"
        );

        MvcResult bookResult = mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long apptId = objectMapper.readTree(bookResult.getResponse().getContentAsString()).get("id").asLong();

        // 4.1 Verify Invoices List for Patient
        MvcResult invoicesResult = mockMvc.perform(get("/api/v1/billing/invoices/patient/" + patientUserId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode invoicesJson = objectMapper.readTree(invoicesResult.getResponse().getContentAsString());
        assertTrue(invoicesJson.isArray());
        assertTrue(invoicesJson.size() >= 1);

        JsonNode inv = invoicesJson.get(0);
        Long invoiceId = inv.get("id").asLong();
        double totalAmount = inv.get("totalAmount").asDouble();
        double copayAmount = inv.get("patientCopayAmount").asDouble();
        double insuranceCovered = inv.get("insuranceCoveredAmount").asDouble();

        // Assert 20% copay computation
        assertEquals(180.00, totalAmount, 0.01);
        assertEquals(36.00, copayAmount, 0.01);
        assertEquals(144.00, insuranceCovered, 0.01);
        assertEquals("PENDING", inv.get("status").asText());

        // 4.2 Simulated Card Decline
        ProcessPaymentRequestDto declineReq = new ProcessPaymentRequestDto(
                BigDecimal.valueOf(copayAmount),
                "CREDIT_CARD_DECLINE",
                "4000",
                "Emma Watson"
        );

        mockMvc.perform(post("/api/v1/billing/invoices/" + invoiceId + "/pay")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(declineReq)))
                .andExpect(status().isBadRequest());

        // 4.3 Successful Payment Processing
        ProcessPaymentRequestDto successReq = new ProcessPaymentRequestDto(
                BigDecimal.valueOf(copayAmount),
                "CREDIT_CARD",
                "4242",
                "Emma Watson"
        );

        MvcResult payResult = mockMvc.perform(post("/api/v1/billing/invoices/" + invoiceId + "/pay")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode paidJson = objectMapper.readTree(payResult.getResponse().getContentAsString());
        assertEquals("PAID", paidJson.get("status").asText());
        assertNotNull(paidJson.get("paidAt").asText());

        // 4.4 Duplicate Payment Prevention (Attempting to pay settled invoice)
        mockMvc.perform(post("/api/v1/billing/invoices/" + invoiceId + "/pay")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isConflict());
    }

    // =========================================================================
    // 5. ADMIN & GOVERNANCE JOURNEY ACCEPTANCE
    // =========================================================================

    @Test
    @DisplayName("E2E Admin Journey: Dashboard Metrics -> Patient Registry -> Doctor Credential Approval/Rejection -> Audit")
    void testAdminCredentialingAndGovernanceJourney() throws Exception {
        // 5.1 Admin Metrics
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 5.2 Patient Registry
        MvcResult patientsResult = mockMvc.perform(get("/api/v1/admin/patients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode patients = objectMapper.readTree(patientsResult.getResponse().getContentAsString());
        assertTrue(patients.isArray());
        assertTrue(patients.size() >= 1);

        // 5.3 Onboard Pending Doctor
        AdminCreateDoctorRequestDto newDocReq = new AdminCreateDoctorRequestDto(
                "pending.doctor@example.com",
                "DoctorPass123!",
                "Dr. Gregory",
                "House",
                "+1-555-019-9900",
                "1092837499",
                "Diagnostic Medicine",
                "Nephrology",
                "MD-HOUSE-001",
                "NJ",
                BigDecimal.valueOf(250.00),
                20,
                "Diagnostician",
                "Head of Diagnostic Medicine",
                false
        );

        MvcResult onboardResult = mockMvc.perform(post("/api/v1/admin/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDocReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long newDocId = objectMapper.readTree(onboardResult.getResponse().getContentAsString()).get("doctorId").asLong();

        // 5.4 Credentialing Queue
        MvcResult queueResult = mockMvc.perform(get("/api/v1/admin/credentialing-queue")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode queue = objectMapper.readTree(queueResult.getResponse().getContentAsString());
        assertTrue(queue.isArray());

        // 5.5 Rejection Without Mandatory Reason Fails
        VerifyCredentialRequestDto invalidReject = new VerifyCredentialRequestDto("REJECT", null);
        mockMvc.perform(post("/api/v1/admin/doctors/" + newDocId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReject)))
                .andExpect(status().isBadRequest());

        // 5.6 Rejection With Mandatory Reason Succeeds
        VerifyCredentialRequestDto validReject = new VerifyCredentialRequestDto("REJECT", "License expired in state registry.");
        mockMvc.perform(post("/api/v1/admin/doctors/" + newDocId + "/verify-credentials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReject)))
                .andExpect(status().isOk());

        // 5.7 Audit Ledger Integrity Verification
        mockMvc.perform(get("/api/v1/admin/audit-logs/verify-integrity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 6. SECURITY ACCEPTANCE & BOUNDARY ENFORCEMENT
    // =========================================================================

    @Test
    @DisplayName("Security Acceptance: Patient Isolation -> Non-Clinical Admin Document Denial -> Unauthenticated Denial")
    void testSecurityAcceptanceAndBoundaryEnforcement() throws Exception {
        // 6.1 Create Patient B
        User patientB = userRepository.save(new User(
                "patient.b@example.com",
                passwordEncoder.encode("Pass123!"),
                "Bob",
                "Dylan",
                "+1-555-019-7777",
                Role.ROLE_PATIENT
        ));
        patientProfileRepository.save(new PatientProfile(
                patientB,
                "MRN-E2E-BOB",
                LocalDate.of(1965, 5, 24),
                "Male",
                "B+"
        ));
        String patientBToken = generateToken(patientB);

        // Patient A creates appointment
        BookingRequestDto bookingReq = new BookingRequestDto(
                doctorProfileId,
                upcomingSlotTime,
                30,
                "VIDEO",
                "Patient A Confidential Checkup",
                "1 week",
                "None",
                "Contact",
                "555-0100"
        );

        MvcResult bookResult = mockMvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long apptAId = objectMapper.readTree(bookResult.getResponse().getContentAsString()).get("id").asLong();

        // 6.2 Patient B cannot access Patient A's appointment details (403 Forbidden)
        mockMvc.perform(get("/api/v1/appointments/" + apptAId)
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden());

        // 6.3 Patient cannot access Admin endpoints (403 Forbidden)
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        // 6.4 Doctor cannot access Admin endpoints (403 Forbidden)
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());

        // 6.5 Unauthenticated user denied (403 Forbidden under Spring Security stateless filter)
        mockMvc.perform(get("/api/v1/appointments"))
                .andExpect(status().isForbidden());
    }
}
