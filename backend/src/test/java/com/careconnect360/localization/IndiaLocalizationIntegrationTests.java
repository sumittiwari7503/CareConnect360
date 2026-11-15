package com.careconnect360.localization;

import com.careconnect360.dto.InvoiceDto;
import com.careconnect360.dto.ProcessPaymentRequestDto;
import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import com.careconnect360.service.BillingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class IndiaLocalizationIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BillingService billingService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User patientUser;
    private PatientProfile patientProfile;
    private User doctorUser;
    private DoctorProfile doctorProfile;

    @BeforeEach
    void setUp() {
        String uid = UUID.randomUUID().toString().substring(0, 8);
        patientUser = userRepository.save(new User(
                "ananya." + uid + "@example.in",
                passwordEncoder.encode("SecurePass123!"),
                "Ananya",
                "Iyer",
                "+91-9876543210",
                Role.ROLE_PATIENT
        ));

        patientProfile = new PatientProfile(
                patientUser,
                "MRN-IN-" + uid,
                LocalDate.of(1992, 4, 15),
                "Female",
                "B+"
        );
        patientProfile.setEmergencyContactName("Karthik Iyer");
        patientProfile.setEmergencyContactPhone("+91-9876543211");
        patientProfile.setInsuranceProvider("Star Health & Allied Insurance");
        patientProfile.setInsurancePolicyNumber("STAR-IND-882910");
        patientProfile.setHouseFlatNumber("Flat 304, Palm Meadows");
        patientProfile.setStreetLocality("HAL Old Airport Road, Kodihalli");
        patientProfile.setLandmark("Near Leela Palace");
        patientProfile.setCity("Bengaluru");
        patientProfile.setDistrict("Bengaluru Urban");
        patientProfile.setStateUt("Karnataka");
        patientProfile.setPinCode("560008");
        patientProfile.setCountry("India");
        patientProfile = patientProfileRepository.save(patientProfile);

        doctorUser = userRepository.save(new User(
                "dr.vikram." + uid + "@example.in",
                passwordEncoder.encode("SecurePass123!"),
                "Vikram",
                "Malhotra",
                "+91-9876543220",
                Role.ROLE_DOCTOR
        ));

        doctorProfile = new DoctorProfile(
                doctorUser,
                "98" + uid.substring(0, 7),
                "Cardiology",
                "KMC-CARD-48201",
                BigDecimal.valueOf(1200.00),
                12
        );
        doctorProfile.setLicenseState("KMC");
        doctorProfile.setBoardCertifications("MBBS, MD (General Medicine), DM (Cardiology) - AIIMS New Delhi");
        doctorProfile.setBio("Senior Consultant Cardiologist accredited by Karnataka Medical Council.");
        doctorProfile = doctorProfileRepository.save(doctorProfile);
    }

    @Test
    @DisplayName("1. Indian Address and Contact Persistence Test")
    void testIndianAddressAndContactPersistence() {
        PatientProfile retrieved = patientProfileRepository.findById(patientProfile.getId()).orElseThrow();

        assertEquals("+91-9876543210", retrieved.getUser().getPhoneNumber());
        assertEquals("Flat 304, Palm Meadows", retrieved.getHouseFlatNumber());
        assertEquals("HAL Old Airport Road, Kodihalli", retrieved.getStreetLocality());
        assertEquals("Near Leela Palace", retrieved.getLandmark());
        assertEquals("Bengaluru", retrieved.getCity());
        assertEquals("Bengaluru Urban", retrieved.getDistrict());
        assertEquals("Karnataka", retrieved.getStateUt());
        assertEquals("560008", retrieved.getPinCode());
        assertEquals("India", retrieved.getCountry());
        assertEquals("Star Health & Allied Insurance", retrieved.getInsuranceProvider());
    }

    @Test
    @DisplayName("2. Indian Medical Council Registration & Fee in INR")
    void testDoctorIndianRegistrationAndFee() {
        DoctorProfile retrieved = doctorProfileRepository.findById(doctorProfile.getId()).orElseThrow();

        assertEquals("KMC", retrieved.getLicenseState());
        assertEquals("KMC-CARD-48201", retrieved.getLicenseNumber());
        assertEquals(0, BigDecimal.valueOf(1200.00).compareTo(retrieved.getConsultationFee()));
        assertTrue(retrieved.getBoardCertifications().contains("AIIMS"));
    }

    @Test
    @DisplayName("3. INR Billing & 20% Co-Pay Math Calculation")
    void testInrBillingAndCopayMath() {
        Appointment appt = new Appointment(
                "APT-IN-2026-001",
                patientProfile,
                doctorProfile,
                Instant.now().plus(1, ChronoUnit.DAYS),
                "VIDEO",
                "Routine cardiac tele-consultation"
        );
        appt = appointmentRepository.save(appt);

        Invoice invoice = billingService.createInvoiceForAppointment(appt, doctorProfile.getConsultationFee());

        assertNotNull(invoice.getId());
        assertEquals(0, BigDecimal.valueOf(1200.00).compareTo(invoice.getTotalAmount()));
        assertEquals(0, BigDecimal.valueOf(240.00).compareTo(invoice.getPatientCopayAmount()));
        assertEquals(0, BigDecimal.valueOf(960.00).compareTo(invoice.getInsuranceCoveredAmount()));
        assertEquals("PENDING", invoice.getStatus());
    }

    @Test
    @DisplayName("4. UPI Payment Settlement via Indian Gateway Simulator")
    void testUpiPaymentSettlement() {
        Appointment appt = new Appointment(
                "APT-IN-2026-002",
                patientProfile,
                doctorProfile,
                Instant.now().plus(2, ChronoUnit.DAYS),
                "VIDEO",
                "Follow-up consultation"
        );
        appt = appointmentRepository.save(appt);

        Invoice invoice = billingService.createInvoiceForAppointment(appt, BigDecimal.valueOf(1000.00));

        ProcessPaymentRequestDto paymentReq = new ProcessPaymentRequestDto(
                BigDecimal.valueOf(200.00),
                "UPI",
                null,
                "Ananya Iyer",
                "ananya.iyer@okhdfcbank",
                "HDFC Bank"
        );

        InvoiceDto settled = billingService.processPayment(invoice.getId(), paymentReq, patientUser.getId(), "ROLE_PATIENT");

        assertEquals("PAID", settled.status());
        assertNotNull(settled.paidAt());
        assertFalse(settled.paymentRecords().isEmpty());
        assertEquals("UPI", settled.paymentRecords().get(0).paymentMethod());
        assertEquals(0, BigDecimal.valueOf(200.00).compareTo(settled.paymentRecords().get(0).amountPaid()));
    }
}
