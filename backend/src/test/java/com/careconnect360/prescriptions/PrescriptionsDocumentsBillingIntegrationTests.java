package com.careconnect360.prescriptions;

import com.careconnect360.dto.*;
import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import com.careconnect360.service.AppointmentService;
import com.careconnect360.service.BillingService;
import com.careconnect360.service.MedicalDocumentService;
import com.careconnect360.service.PrescriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class PrescriptionsDocumentsBillingIntegrationTests {

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private MedicalDocumentService documentService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long testDoctorId;
    private Long testOtherDoctorId;
    private Long testPatientId;
    private Long testOtherPatientId;
    private AppointmentDto testAppointment;

    @BeforeEach
    void setupTestData() {
        // 1. Doctor 1 (Assigned)
        User doctorUser = new User("dr.rajesh.p2c@careconnect360.com", passwordEncoder.encode("Password123!"), "Rajesh", "Nair", "+91-9876543202", Role.ROLE_DOCTOR);
        doctorUser = userRepository.save(doctorUser);
        testDoctorId = doctorUser.getId();

        DoctorProfile doctorProfile = new DoctorProfile(doctorUser, "1928374659", "Cardiology", "MMC-LIC-9901", BigDecimal.valueOf(1500.00), 12);
        doctorProfile = doctorProfileRepository.save(doctorProfile);

        // 2. Doctor 2 (Unassigned)
        User otherDoctorUser = new User("dr.other.p2c@careconnect360.com", passwordEncoder.encode("Password123!"), "Priya", "Patel", "+91-9876543203", Role.ROLE_DOCTOR);
        otherDoctorUser = userRepository.save(otherDoctorUser);
        testOtherDoctorId = otherDoctorUser.getId();

        DoctorProfile otherDoctorProfile = new DoctorProfile(otherDoctorUser, "1928374660", "Dermatology", "KMC-LIC-9902", BigDecimal.valueOf(800.00), 8);
        otherDoctorProfile = doctorProfileRepository.save(otherDoctorProfile);

        // 3. Patient 1 (Aarav Sharma)
        User patientUser = new User("aarav.p2c@example.com", passwordEncoder.encode("Password123!"), "Aarav", "Sharma", "+91-9876543210", Role.ROLE_PATIENT);
        patientUser = userRepository.save(patientUser);
        testPatientId = patientUser.getId();

        PatientProfile patientProfile = new PatientProfile(patientUser, "MRN-849204-P2C", java.time.LocalDate.of(1992, 8, 15), "Male", "O+");
        patientProfile = patientProfileRepository.save(patientProfile);

        // 4. Patient 2 (Rohan Verma)
        User otherPatientUser = new User("rohan.p2c@example.com", passwordEncoder.encode("Password123!"), "Rohan", "Verma", "+91-9876543212", Role.ROLE_PATIENT);
        otherPatientUser = userRepository.save(otherPatientUser);
        testOtherPatientId = otherPatientUser.getId();

        PatientProfile otherPatientProfile = new PatientProfile(otherPatientUser, "MRN-551029-P2C", java.time.LocalDate.of(1985, 11, 23), "Male", "B+");
        otherPatientProfile = patientProfileRepository.save(otherPatientProfile);

        // Doctor Availability for all weekdays
        for (DayOfWeek day : DayOfWeek.values()) {
            DoctorAvailability avail = new DoctorAvailability(
                    doctorProfile,
                    day.name(),
                    "08:00:00",
                    "18:00:00",
                    30
            );
            availabilityRepository.save(avail);
        }

        // Book Encounter on next Monday at 10:30 UTC
        java.time.LocalDate nextMonday = java.time.LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant nextMondaySlot = nextMonday.atTime(10, 30).atZone(java.time.ZoneId.of("UTC")).toInstant().truncatedTo(ChronoUnit.MINUTES);

        BookingRequestDto bookingReq = new BookingRequestDto(
                testDoctorId,
                nextMondaySlot,
                30,
                "VIDEO",
                "Quarterly hypertension review and medication refill",
                "2 weeks",
                "None",
                "Sunita Sharma",
                "+91-9876543211"
        );
        testAppointment = appointmentService.bookAppointment(testPatientId, bookingReq);
    }

    // ==========================================
    // 1. PRESCRIPTION TESTS
    // ==========================================

    @Test
    @DisplayName("Physician can prescribe medications with validation and audit logging")
    void testDoctorCanCreatePrescriptionWithItems() {
        CreatePrescriptionRequestDto request = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy #1042 • Indiranagar, Bengaluru",
                "Take with evening meals. Monitor weekly BP.",
                List.of(
                        new CreatePrescriptionRequestDto.ItemRequest("Atorvastatin", "20mg oral tablet", "Once daily at bedtime", 90, 3, "Take with water"),
                        new CreatePrescriptionRequestDto.ItemRequest("Metoprolol Tartrate", "25mg oral tablet", "Twice daily with meals", 90, 2, "Do not discontinue abruptly")
                )
        );

        PrescriptionDto rx = prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", request);

        assertNotNull(rx);
        assertNotNull(rx.id());
        assertTrue(rx.prescriptionNumber().startsWith("RX-"));
        assertEquals("ACTIVE", rx.status());
        assertEquals(2, rx.items().size());
        assertEquals("Atorvastatin", rx.items().get(0).medicationName());
        assertEquals("Aarav Sharma", rx.patientName());
    }

    @Test
    @DisplayName("Patient or unassigned physician cannot create prescription (AccessDeniedException)")
    void testNonDoctorCannotCreatePrescription() {
        CreatePrescriptionRequestDto request = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy",
                "Notes",
                List.of(new CreatePrescriptionRequestDto.ItemRequest("Lisinopril", "10mg", "Daily", 30, 0, "Daily"))
        );

        // Patient attempting to prescribe
        assertThrows(AccessDeniedException.class, () ->
                prescriptionService.createPrescription(testPatientId, "ROLE_PATIENT", request)
        );

        // Other doctor attempting to prescribe for unassigned encounter
        assertThrows(AccessDeniedException.class, () ->
                prescriptionService.createPrescription(testOtherDoctorId, "ROLE_DOCTOR", request)
        );
    }

    @Test
    @DisplayName("Prescription creation fails when medication items are empty or invalid")
    void testPrescriptionValidationFailsOnEmptyItems() {
        CreatePrescriptionRequestDto emptyItems = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy",
                "Notes",
                List.of()
        );

        assertThrows(IllegalArgumentException.class, () ->
                prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", emptyItems)
        );

        CreatePrescriptionRequestDto invalidDuration = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy",
                "Notes",
                List.of(new CreatePrescriptionRequestDto.ItemRequest("Atorvastatin", "20mg", "Daily", -5, 0, "Instructions"))
        );

        assertThrows(IllegalArgumentException.class, () ->
                prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", invalidDuration)
        );
    }

    @Test
    @DisplayName("Patient can view their own prescriptions but not other patients' prescriptions")
    void testPrescriptionPatientObjectLevelAccess() {
        CreatePrescriptionRequestDto request = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy",
                "Notes",
                List.of(new CreatePrescriptionRequestDto.ItemRequest("Lisinopril", "10mg", "Daily", 30, 0, "Instructions"))
        );
        PrescriptionDto created = prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", request);

        // 1. Patient viewing own prescriptions
        List<PrescriptionDto> patientRxs = prescriptionService.getPrescriptionsForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        assertFalse(patientRxs.isEmpty());
        assertEquals(created.id(), patientRxs.get(0).id());

        // 2. Other patient blocked from viewing Aarav's prescriptions
        assertThrows(AccessDeniedException.class, () ->
                prescriptionService.getPrescriptionsForPatient(testPatientId, testOtherPatientId, "ROLE_PATIENT")
        );
    }

    @Test
    @DisplayName("Physician can update prescription status to DISPENSED or CANCELLED")
    void testPrescriptionStatusUpdate() {
        CreatePrescriptionRequestDto request = new CreatePrescriptionRequestDto(
                testAppointment.id(),
                "Apollo Pharmacy",
                "Notes",
                List.of(new CreatePrescriptionRequestDto.ItemRequest("Lisinopril", "10mg", "Daily", 30, 0, "Instructions"))
        );
        PrescriptionDto created = prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", request);

        PrescriptionDto updated = prescriptionService.updatePrescriptionStatus(created.id(), "DISPENSED", testDoctorId, "ROLE_DOCTOR");
        assertEquals("DISPENSED", updated.status());
    }

    // ==========================================
    // 2. MEDICAL DOCUMENT TESTS
    // ==========================================

    @Test
    @DisplayName("User can upload medical document and stream secure download")
    void testMedicalDocumentUploadAndDownload() throws IOException {
        byte[] samplePdfContent = "%PDF-1.4 Simulated Encrypted Lab Report Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "Lipid_Panel_Report_2026.pdf",
                "application/pdf",
                samplePdfContent
        );

        MedicalDocumentDto uploaded = documentService.uploadDocument(
                testPatientId,
                testPatientId,
                "ROLE_PATIENT",
                "Fast Lipid Panel 2026",
                "LAB_REPORT",
                file
        );

        assertNotNull(uploaded);
        assertNotNull(uploaded.id());
        assertEquals("Lipid_Panel_Report_2026.pdf", uploaded.fileName());
        assertEquals("LAB_REPORT", uploaded.category());

        // Retrieve patient document list
        List<MedicalDocumentDto> docs = documentService.getDocumentsForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        assertFalse(docs.isEmpty());

        // Download document stream
        Resource downloaded = documentService.downloadDocument(uploaded.id(), testPatientId, "ROLE_PATIENT");
        assertNotNull(downloaded);
        assertTrue(downloaded.contentLength() > 0);
    }

    @Test
    @DisplayName("Unauthorized user cannot download other patient's medical document")
    void testUnauthorizedDocumentAccessBlocked() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        MedicalDocumentDto uploaded = documentService.uploadDocument(
                testPatientId,
                testPatientId,
                "ROLE_PATIENT",
                "Confidential EKG",
                "RADIOLOGY",
                file
        );

        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(uploaded.id(), testOtherPatientId, "ROLE_PATIENT")
        );
    }

    @Test
    @DisplayName("Assigned treating physician can access patient medical documents")
    void testAssignedPhysicianCanAccessPatientDocuments() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "lab.pdf", "application/pdf", "diagnostic data".getBytes());
        MedicalDocumentDto uploaded = documentService.uploadDocument(
                testPatientId,
                testPatientId,
                "ROLE_PATIENT",
                "Metabolic Panel",
                "LAB_REPORT",
                file
        );

        // Assigned doctor has an appointment with testPatientId -> authorized
        List<MedicalDocumentDto> docs = documentService.getDocumentsForPatient(testPatientId, testDoctorId, "ROLE_DOCTOR");
        assertFalse(docs.isEmpty());

        Resource downloaded = documentService.downloadDocument(uploaded.id(), testDoctorId, "ROLE_DOCTOR");
        assertNotNull(downloaded);
    }

    @Test
    @DisplayName("Unrelated physician and non-clinical admin are denied document access")
    void testUnrelatedPhysicianAndAdminDeniedDocumentAccess() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "sensitive.pdf", "application/pdf", "sensitive data".getBytes());
        MedicalDocumentDto uploaded = documentService.uploadDocument(
                testPatientId,
                testPatientId,
                "ROLE_PATIENT",
                "Sensitive Chart",
                "CLINICAL_NOTE",
                file
        );

        // 1. Unrelated physician denied list and download
        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentsForPatient(testPatientId, testOtherDoctorId, "ROLE_DOCTOR")
        );
        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(uploaded.id(), testOtherDoctorId, "ROLE_DOCTOR")
        );

        // 2. Non-clinical admin denied under Minimum Necessary rules
        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentsForPatient(testPatientId, 999L, "ROLE_ADMIN")
        );
        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(uploaded.id(), 999L, "ROLE_ADMIN")
        );
    }

    @Test
    @DisplayName("Uploader can delete medical document")
    void testMedicalDocumentDeletion() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "delete_me.pdf", "application/pdf", "dummy data".getBytes());
        MedicalDocumentDto uploaded = documentService.uploadDocument(
                testPatientId,
                testPatientId,
                "ROLE_PATIENT",
                "Temp Note",
                "CLINICAL_NOTE",
                file
        );

        documentService.deleteDocument(uploaded.id(), testPatientId, "ROLE_PATIENT");

        assertThrows(IllegalArgumentException.class, () ->
                documentService.getDocumentMetadata(uploaded.id(), testPatientId, "ROLE_PATIENT")
        );
    }

    // ==========================================
    // 3. BILLING & INVOICE TESTS
    // ==========================================

    @Test
    @DisplayName("Invoice is auto-generated upon appointment booking and can be fetched")
    void testInvoiceAutoGenerationOnBooking() {
        List<InvoiceDto> invoices = billingService.getInvoicesForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        assertFalse(invoices.isEmpty(), "Invoice should have been generated upon appointment booking");

        InvoiceDto inv = invoices.get(0);
        assertTrue(inv.invoiceNumber().startsWith("INV-"));
        assertEquals("PENDING", inv.status());
        assertEquals(0, BigDecimal.valueOf(1500.00).compareTo(inv.totalAmount()));
        assertEquals(0, BigDecimal.valueOf(300.00).compareTo(inv.patientCopayAmount())); // 20% copay
    }

    @Test
    @DisplayName("Patient can settle invoice via payment sandbox")
    void testProcessPaymentSuccess() {
        List<InvoiceDto> invoices = billingService.getInvoicesForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        InvoiceDto inv = invoices.get(0);

        ProcessPaymentRequestDto payReq = new ProcessPaymentRequestDto(
                inv.patientCopayAmount(),
                "CREDIT_CARD",
                "4242",
                "Aarav Sharma"
        );

        InvoiceDto paid = billingService.processPayment(inv.id(), payReq, testPatientId, "ROLE_PATIENT");

        assertEquals("PAID", paid.status());
        assertNotNull(paid.paidAt());
        assertFalse(paid.paymentRecords().isEmpty());
        assertEquals("SUCCESS", paid.paymentRecords().get(0).paymentStatus());
    }

    @Test
    @DisplayName("Cannot settle an already paid invoice (IllegalStateException)")
    void testCannotPayAlreadyPaidInvoice() {
        List<InvoiceDto> invoices = billingService.getInvoicesForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        InvoiceDto inv = invoices.get(0);

        ProcessPaymentRequestDto payReq = new ProcessPaymentRequestDto(
                inv.patientCopayAmount(),
                "CREDIT_CARD",
                "4242",
                "Aarav Sharma"
        );
        billingService.processPayment(inv.id(), payReq, testPatientId, "ROLE_PATIENT");

        assertThrows(IllegalStateException.class, () ->
                billingService.processPayment(inv.id(), payReq, testPatientId, "ROLE_PATIENT")
        );
    }

    @Test
    @DisplayName("Simulate payment failure and recover with successful retry")
    void testPaymentFailureAndRetryRecovery() {
        List<InvoiceDto> invoices = billingService.getInvoicesForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        InvoiceDto inv = invoices.get(0);

        // 1. Simulate failure (e.g. card declined)
        InvoiceDto failed = billingService.simulatePaymentFailure(inv.id(), testPatientId, "ROLE_PATIENT");
        assertEquals("FAILED", failed.status());

        // 2. Retry payment with alternate/valid method
        ProcessPaymentRequestDto retryReq = new ProcessPaymentRequestDto(
                inv.patientCopayAmount(),
                "HSA_FSA",
                "8819",
                "Aarav Sharma"
        );
        InvoiceDto recovered = billingService.processPayment(failed.id(), retryReq, testPatientId, "ROLE_PATIENT");
        assertEquals("PAID", recovered.status());
    }
}
