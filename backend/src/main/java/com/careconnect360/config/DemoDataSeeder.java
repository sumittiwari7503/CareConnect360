package com.careconnect360.config;

import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import com.careconnect360.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.demo.seed-dev-personas", havingValue = "true", matchIfMissing = false)
public class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.enabled:true}")
    private boolean demoModeEnabled;

    public DemoDataSeeder(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            PatientProfileRepository patientProfileRepository,
            DoctorAvailabilityRepository availabilityRepository,
            AppointmentRepository appointmentRepository,
            InvoiceRepository invoiceRepository,
            PaymentRecordRepository paymentRecordRepository,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.availabilityRepository = availabilityRepository;
        this.appointmentRepository = appointmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDemoDataIfEmpty() {
        if (!demoModeEnabled) {
            log.info("Demo mode disabled. Skipping synthetic demo data seeding.");
            return;
        }

        if (userRepository.findByEmail("priya.sundaram@careconnect360.com").isPresent()
                || userRepository.findByEmail("aarav.sharma@example.com").isPresent()) {
            return;
        }

        log.info("Seeding synthetic CareConnect360 India development personas...");

        String encodedPassword = passwordEncoder.encode("CareConnect360!");

        // 1. Admin: Priya Sundaram
        userRepository.save(new User(
                "priya.sundaram@careconnect360.com",
                encodedPassword,
                "Priya",
                "Sundaram",
                "+91-9876543201",
                Role.ROLE_ADMIN
        ));

        // 2. Doctor 1: Dr. Rajesh Nair (Cardiology) - Approved
        User docNairUser = userRepository.save(new User(
                "dr.rajesh.nair@example.com",
                encodedPassword,
                "Rajesh",
                "Nair",
                "+91-9876543202",
                Role.ROLE_DOCTOR
        ));
        DoctorProfile docNair = new DoctorProfile(
                docNairUser,
                "1928374601",
                "Cardiology",
                "MMC-CARD-88391",
                BigDecimal.valueOf(1500.00),
                14
        );
        docNair.setSubSpecialty("Interventional Cardiology");
        docNair.setLicenseState("MMC");
        docNair.setBoardCertifications("MBBS, MD (General Medicine), DM (Cardiology) - AIIMS New Delhi");
        docNair.setBio("[DEMO CREDENTIAL] Senior Consultant Cardiologist with clinical fellowship at AIIMS. Specializing in preventive cardiac care, clinical telemetry, and hypertension management.");
        docNair.setAverageRating(BigDecimal.valueOf(4.95));
        docNair.setTotalReviews(128);
        docNair.setAcceptingPatients(true);
        docNair.setCredentialingStatus("APPROVED");
        docNair.setSynthetic(true);
        docNair = doctorProfileRepository.save(docNair);

        availabilityRepository.save(new DoctorAvailability(docNair, "TUESDAY", "10:00:00", "18:00:00", 45));
        availabilityRepository.save(new DoctorAvailability(docNair, "THURSDAY", "10:00:00", "18:00:00", 45));

        // 3. Doctor 2: Dr. Priya Patel (Internal Medicine / General Medicine) - Approved
        User docPatelUser = userRepository.save(new User(
                "dr.priya.patel@example.com",
                encodedPassword,
                "Priya",
                "Patel",
                "+91-9876543203",
                Role.ROLE_DOCTOR
        ));
        DoctorProfile docPatel = new DoctorProfile(
                docPatelUser,
                "1092837401",
                "Internal Medicine",
                "KMC-MED-99201",
                BigDecimal.valueOf(800.00),
                11
        );
        docPatel.setSubSpecialty("Preventive Health");
        docPatel.setLicenseState("KMC");
        docPatel.setBoardCertifications("MBBS, MD (Internal Medicine) - Kasturba Medical College, Manipal");
        docPatel.setBio("[DEMO CREDENTIAL] Specializing in adult comprehensive primary care, chronic condition monitoring, and telemetry-guided virtual consults across India.");
        docPatel.setAverageRating(BigDecimal.valueOf(4.91));
        docPatel.setTotalReviews(214);
        docPatel.setAcceptingPatients(true);
        docPatel.setCredentialingStatus("APPROVED");
        docPatel.setSynthetic(true);
        docPatel = doctorProfileRepository.save(docPatel);

        availabilityRepository.save(new DoctorAvailability(docPatel, "MONDAY", "09:00:00", "17:00:00", 30));
        availabilityRepository.save(new DoctorAvailability(docPatel, "WEDNESDAY", "09:00:00", "17:00:00", 30));
        availabilityRepository.save(new DoctorAvailability(docPatel, "FRIDAY", "09:00:00", "16:00:00", 30));

        // 4. Doctor 3: Dr. Ananya Sharma (Pediatrics) - Approved
        User docSharmaUser = userRepository.save(new User(
                "dr.ananya.sharma@example.com",
                encodedPassword,
                "Ananya",
                "Sharma",
                "+91-9876543204",
                Role.ROLE_DOCTOR
        ));
        DoctorProfile docSharma = new DoctorProfile(
                docSharmaUser,
                "1394820101",
                "Pediatrics",
                "DMC-PED-44912",
                BigDecimal.valueOf(1000.00),
                9
        );
        docSharma.setSubSpecialty("Pediatric Critical Care");
        docSharma.setLicenseState("DMC");
        docSharma.setBoardCertifications("MBBS, MD (Pediatrics) - PGIMER Chandigarh");
        docSharma.setBio("[DEMO CREDENTIAL] Senior Pediatrician specializing in infant development, childhood immunizations, and virtual pediatric guidance.");
        docSharma.setAverageRating(BigDecimal.valueOf(4.98));
        docSharma.setTotalReviews(89);
        docSharma.setAcceptingPatients(true);
        docSharma.setCredentialingStatus("APPROVED");
        docSharma.setSynthetic(true);
        docSharma = doctorProfileRepository.save(docSharma);

        availabilityRepository.save(new DoctorAvailability(docSharma, "TUESDAY", "10:00:00", "17:00:00", 30));
        availabilityRepository.save(new DoctorAvailability(docSharma, "THURSDAY", "10:00:00", "17:00:00", 30));
        availabilityRepository.save(new DoctorAvailability(docSharma, "SATURDAY", "10:00:00", "15:00:00", 30));

        // 5. Doctor 4: Dr. Vikram Malhotra (Neurology) - Pending Credentialing
        User docMalhotraUser = userRepository.save(new User(
                "dr.vikram.malhotra@example.com",
                encodedPassword,
                "Vikram",
                "Malhotra",
                "+91-9876543205",
                Role.ROLE_DOCTOR
        ));
        DoctorProfile docMalhotra = new DoctorProfile(
                docMalhotraUser,
                "1489201901",
                "Neurology",
                "MMC-NEUR-49210",
                BigDecimal.valueOf(1800.00),
                16
        );
        docMalhotra.setSubSpecialty("Clinical Neurophysiology");
        docMalhotra.setCredentialingStatus("PENDING");
        docMalhotra.setLicenseState("MMC");
        docMalhotra.setBoardCertifications("MBBS, MD (Medicine), DM (Neurology) - NIMHANS Bengaluru");
        docMalhotra.setBio("[DEMO CREDENTIAL] AIIMS & NIMHANS Fellow. Specializing in neuromuscular disorders, stroke recovery, and clinical neurophysiology.");
        docMalhotra.setSynthetic(true);
        doctorProfileRepository.save(docMalhotra);

        // 6. Patient: Aarav Sharma
        User patientUser = userRepository.save(new User(
                "aarav.sharma@example.com",
                encodedPassword,
                "Aarav",
                "Sharma",
                "+91-9876543210",
                Role.ROLE_PATIENT
        ));
        PatientProfile patientProfile = new PatientProfile(
                patientUser,
                "MRN-IND-849204",
                LocalDate.of(1992, 8, 15),
                "Male",
                "O+"
        );
        patientProfile.setEmergencyContactName("Sunita Sharma");
        patientProfile.setEmergencyContactPhone("+91-9876543211");
        patientProfile.setInsuranceProvider("Star Health Comprehensive Insurance");
        patientProfile.setInsurancePolicyNumber("STAR-IND-9948201");
        patientProfile.setHouseFlatNumber("Flat 402, Block B, Prestige Palms");
        patientProfile.setStreetLocality("14th Main, 5th Cross, Indiranagar");
        patientProfile.setLandmark("Near BDA Complex");
        patientProfile.setCity("Bengaluru");
        patientProfile.setDistrict("Bengaluru Urban");
        patientProfile.setStateUt("Karnataka");
        patientProfile.setPinCode("560038");
        patientProfile.setCountry("India");
        patientProfile = patientProfileRepository.save(patientProfile);

        // Sample Appointment 1: Aarav Sharma with Dr. Priya Patel (General Medicine) - Confirmed
        Appointment appt1 = new Appointment(
                "APT-2026-9104",
                patientProfile,
                docPatel,
                Instant.now().plus(2, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES),
                "VIDEO",
                "Quarterly hypertension checkup and review of recent telemetry readings"
        );
        appt1.setStatus("CONFIRMED");
        appt1.setDurationMinutes(30);
        appt1 = appointmentRepository.save(appt1);

        Invoice inv1 = new Invoice(
                "INV-2026-9104",
                appt1,
                patientProfile,
                BigDecimal.valueOf(800.00),
                BigDecimal.valueOf(640.00),
                BigDecimal.valueOf(160.00),
                LocalDate.now().plusDays(15)
        );
        inv1.setStatus("PAID");
        inv1.setPaidAt(Instant.now().minus(1, ChronoUnit.DAYS));
        inv1 = invoiceRepository.save(inv1);

        paymentRecordRepository.save(new PaymentRecord(
                inv1,
                "TXN-UPI-9948201-OKHDFC",
                BigDecimal.valueOf(160.00),
                "UPI",
                "SUCCESS"
        ));

        // Sample Appointment 2: Aarav Sharma with Dr. Rajesh Nair (Cardiology) - Pending Payment demo
        Appointment appt2 = new Appointment(
                "APT-2026-3950",
                patientProfile,
                docNair,
                Instant.now().plus(26, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES),
                "VIDEO",
                "Specialist Cardiology consultation and Holter monitor review"
        );
        appt2.setStatus("CONFIRMED");
        appt2.setDurationMinutes(45);
        appt2 = appointmentRepository.save(appt2);

        Invoice inv2 = new Invoice(
                "INV-2026-3950",
                appt2,
                patientProfile,
                BigDecimal.valueOf(1500.00),
                BigDecimal.valueOf(1200.00),
                BigDecimal.valueOf(300.00),
                LocalDate.now().plusDays(15)
        );
        inv2.setStatus("PENDING");
        inv2 = invoiceRepository.save(inv2);

        // Seed Notifications for Aarav Sharma
        notificationService.seedInitialNotifications(patientUser);

        log.info("Synthetic demo data seeding complete. Default demo password: CareConnect360!");
    }
}
