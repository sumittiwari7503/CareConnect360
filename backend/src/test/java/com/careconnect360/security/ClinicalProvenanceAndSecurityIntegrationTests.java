package com.careconnect360.security;

import com.careconnect360.dto.*;
import com.careconnect360.entity.*;
import com.careconnect360.exception.InvalidBookingException;
import com.careconnect360.integration.eprescribe.EPrescribingGatewayAdapter;
import com.careconnect360.integration.payment.PaymentGatewayAdapter;
import com.careconnect360.repository.*;
import com.careconnect360.service.AppointmentService;
import com.careconnect360.service.BillingService;
import com.careconnect360.service.PrescriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class ClinicalProvenanceAndSecurityIntegrationTests {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private PrescriptionService prescriptionService;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PaymentGatewayAdapter paymentGatewayAdapter;

    @Autowired
    private EPrescribingGatewayAdapter eprescribingGatewayAdapter;

    private Long testDoctorId;
    private Long testPatientId;
    private Instant validSlotTime;

    @BeforeEach
    void setupData() {
        User doctorUser = userRepository.save(new User(
                "prov.doctor@example.com",
                passwordEncoder.encode("DoctorPass123!"),
                "Alexander",
                "Wright",
                "+1-555-010-8888",
                Role.ROLE_DOCTOR
        ));

        DoctorProfile docProfile = new DoctorProfile(
                doctorUser,
                "1092837411",
                "Internal Medicine",
                "MD-PROV-1122",
                BigDecimal.valueOf(160.00),
                15
        );
        docProfile.setAcceptingPatients(true);
        docProfile = doctorProfileRepository.save(docProfile);
        testDoctorId = docProfile.getId();

        User patientUser = userRepository.save(new User(
                "prov.patient@example.com",
                passwordEncoder.encode("PatientPass123!"),
                "Robert",
                "Paulson",
                "+1-555-010-9999",
                Role.ROLE_PATIENT
        ));

        PatientProfile patProfile = new PatientProfile(
                patientUser,
                "MRN-PROV-4411",
                LocalDate.of(1980, 5, 20),
                "Male",
                "O+"
        );
        patProfile = patientProfileRepository.save(patProfile);
        testPatientId = patProfile.getId();

        for (DayOfWeek day : DayOfWeek.values()) {
            availabilityRepository.save(new DoctorAvailability(
                    docProfile,
                    day.name(),
                    "08:00:00",
                    "18:00:00",
                    30
            ));
        }

        LocalDate nextTuesday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.TUESDAY));
        validSlotTime = nextTuesday.atTime(11, 0).atZone(ZoneId.of("UTC")).toInstant().truncatedTo(ChronoUnit.MINUTES);
    }

    private BookingRequestDto sampleBooking() {
        return new BookingRequestDto(
                testDoctorId,
                validSlotTime,
                30,
                "VIDEO",
                "Clinical checkup and review",
                "1 week",
                "None",
                "Jane Paulson",
                "555-0199"
        );
    }

    @Test
    @DisplayName("Server rejects vitals submitted with NOT_RECORDED provenance")
    void testRejectsVitalsWithNotRecordedProvenance() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Clinical encounter documented",
                "I10",
                "Hypertension",
                124,
                82,
                72,
                98,
                "NOT_RECORDED"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request)
        );
        assertTrue(ex.getMessage().contains("NOT_RECORDED"));
    }

    @Test
    @DisplayName("Server rejects systolic blood pressure less than or equal to diastolic blood pressure")
    void testRejectsSystolicLessThanDiastolic() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Clinical encounter documented",
                "I10",
                "Hypertension",
                80,
                120, // Inverted: Systolic 80 < Diastolic 120
                72,
                98,
                "MEASURED"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request)
        );
        assertTrue(ex.getMessage().contains("must be greater than diastolic"));
    }

    @Test
    @DisplayName("Server rejects physiologically implausible vital readings (SpO2 > 100%)")
    void testRejectsOutOfRangeVitalReadings() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Clinical encounter documented",
                "I10",
                "Hypertension",
                120,
                80,
                72,
                105, // Impossible SpO2
                "MEASURED"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request)
        );
        assertTrue(ex.getMessage().contains("SpO2"));
    }

    @Test
    @DisplayName("Server accepts valid clinician-measured vitals and stores MEASURED provenance")
    void testAcceptsValidClinicianMeasuredVitals() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Patient demonstrates stable cardioprotective profile.",
                "I10",
                "Essential Hypertension",
                122,
                78,
                70,
                99,
                "MEASURED"
        );

        AppointmentDto completed = appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request);
        assertEquals("COMPLETED", completed.status());

        ConsultationRecordDto record = appointmentService.getConsultationRecord(booked.id(), testDoctorId, "ROLE_DOCTOR");
        assertNotNull(record);
        assertEquals(122, record.systolicBp());
        assertEquals(78, record.diastolicBp());
        assertEquals("MEASURED", record.vitalsProvenance());
    }

    @Test
    @DisplayName("Server accepts unrecorded vitals and defaults provenance to NOT_RECORDED")
    void testAcceptsNullVitalsAndDefaultsProvenanceToNotRecorded() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Virtual follow-up. Biometrics not obtained during this encounter.",
                "Z00.00",
                "General adult medical examination",
                null,
                null,
                null,
                null,
                null
        );

        AppointmentDto completed = appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request);
        assertEquals("COMPLETED", completed.status());

        ConsultationRecordDto record = appointmentService.getConsultationRecord(booked.id(), testDoctorId, "ROLE_DOCTOR");
        assertNotNull(record);
        assertNull(record.systolicBp());
        assertNull(record.diastolicBp());
        assertEquals("NOT_RECORDED", record.vitalsProvenance());
    }

    @Test
    @DisplayName("Telehealth room session token is denied when access window has expired (>2 hours)")
    void testRoomSessionTokenDeniedWhenExpired() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());

        // Backdate the scheduled time to 3 hours ago
        Appointment appt = appointmentRepository.findById(booked.id()).orElseThrow();
        appt.setScheduledTime(Instant.now().minus(3, ChronoUnit.HOURS));
        appointmentRepository.save(appt);

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                appointmentService.getRoomSessionToken(booked.id(), testPatientId, "ROLE_PATIENT")
        );
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("Telehealth room session token is denied when consultation is already COMPLETED")
    void testRoomSessionTokenDeniedWhenCompleted() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto request = new CompleteConsultationRequestDto(
                "Consultation completed.",
                "Z00.00",
                "General checkup",
                null,
                null,
                null,
                null,
                null
        );
        appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", request);

        InvalidBookingException ex = assertThrows(InvalidBookingException.class, () ->
                appointmentService.getRoomSessionToken(booked.id(), testPatientId, "ROLE_PATIENT")
        );
        assertTrue(ex.getMessage().contains("closed"));
    }

    @Test
    @DisplayName("Payment gateway adapter handles payment processing and decline simulation cleanly")
    void testPaymentGatewayAdapterIntegration() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());
        List<InvoiceDto> invoices = billingService.getInvoicesForPatient(testPatientId, testPatientId, "ROLE_PATIENT");
        assertFalse(invoices.isEmpty());
        InvoiceDto inv = invoices.getFirst();

        // 1. Process standard charge
        ProcessPaymentRequestDto payReq = new ProcessPaymentRequestDto(
                inv.patientCopayAmount(),
                "CREDIT_CARD",
                "4242",
                "Robert Paulson"
        );
        InvoiceDto paid = billingService.processPayment(inv.id(), payReq, testPatientId, "ROLE_PATIENT");
        assertEquals("PAID", paid.status());

        // 2. Gateway adapter reporting
        assertEquals("SIMULATED_PCI_SANDBOX", paymentGatewayAdapter.getProviderName());
        assertFalse(paymentGatewayAdapter.isLiveGateway());
    }

    @Test
    @DisplayName("E-Prescribing gateway adapter dispatches prescriptions with NCPDP SCRIPT 2017071 metadata")
    void testEPrescribingGatewayAdapterIntegration() {
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, sampleBooking());

        CreatePrescriptionRequestDto rxRequest = new CreatePrescriptionRequestDto(
                booked.id(),
                "Community Health Pharmacy",
                "Take with meal in the morning",
                List.of(new CreatePrescriptionRequestDto.ItemRequest(
                        "Lisinopril",
                        "10mg",
                        "Once daily",
                        30,
                        2,
                        "Take with plenty of water"
                ))
        );

        PrescriptionDto rx = prescriptionService.createPrescription(testDoctorId, "ROLE_DOCTOR", rxRequest);
        assertNotNull(rx);
        assertEquals("ACTIVE", rx.status());
        assertEquals("Community Health Pharmacy", rx.pharmacyName());

        assertEquals("SIMULATED_NCPDP_SCRIPT_2017071", eprescribingGatewayAdapter.getGatewayName());
        assertFalse(eprescribingGatewayAdapter.isLiveGateway());
    }
}
