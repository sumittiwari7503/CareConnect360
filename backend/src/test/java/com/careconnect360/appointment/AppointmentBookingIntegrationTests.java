package com.careconnect360.appointment;

import com.careconnect360.dto.AppointmentDto;
import com.careconnect360.dto.BookingRequestDto;
import com.careconnect360.dto.DoctorDto;
import com.careconnect360.dto.RescheduleRequestDto;
import com.careconnect360.dto.TimeSlotDto;
import com.careconnect360.entity.*;
import com.careconnect360.exception.InvalidBookingException;
import com.careconnect360.exception.SlotConflictException;
import com.careconnect360.repository.*;
import com.careconnect360.service.AppointmentService;
import com.careconnect360.service.DoctorService;
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
class AppointmentBookingIntegrationTests {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorService doctorService;

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
    private Long testPatientId1;
    private Long testPatientId2;

    @BeforeEach
    void setupTestData() {
        // Create Doctor
        if (userRepository.findByEmail("doc.priya@test.in").isEmpty()) {
            User docUser = userRepository.save(new User(
                    "doc.priya@test.in",
                    passwordEncoder.encode("Pass123#"),
                    "Priya",
                    "Patel",
                    "+91-9876543203",
                    Role.ROLE_DOCTOR
            ));
            DoctorProfile docProfile = doctorProfileRepository.save(new DoctorProfile(
                    docUser,
                    "1092837465",
                    "Internal Medicine",
                    "KMC-LIC-992",
                    BigDecimal.valueOf(800.00),
                    12
            ));
            testDoctorId = docProfile.getId();

            // Set Monday working hours: 09:00 - 17:00
            availabilityRepository.save(new DoctorAvailability(
                    docProfile,
                    "MONDAY",
                    "09:00:00",
                    "17:00:00",
                    30
            ));
        } else {
            testDoctorId = doctorProfileRepository.findByNpi("1092837465").orElseThrow().getId();
        }

        // Create Patient 1 (Aarav)
        if (userRepository.findByEmail("patient.aarav@test.in").isEmpty()) {
            User p1User = userRepository.save(new User(
                    "patient.aarav@test.in",
                    passwordEncoder.encode("Pass123#"),
                    "Aarav",
                    "Sharma",
                    "+91-9876543210",
                    Role.ROLE_PATIENT
            ));
            PatientProfile p1Profile = patientProfileRepository.save(new PatientProfile(
                    p1User,
                    "MRN-IND-849204",
                    LocalDate.of(1992, 8, 15),
                    "Male",
                    "O+"
            ));
            testPatientId1 = p1Profile.getId();
        } else {
            testPatientId1 = patientProfileRepository.findByMrn("MRN-IND-849204").orElseThrow().getId();
        }

        // Create Patient 2 (Rohan)
        if (userRepository.findByEmail("patient.rohan@test.in").isEmpty()) {
            User p2User = userRepository.save(new User(
                    "patient.rohan@test.in",
                    passwordEncoder.encode("Pass123#"),
                    "Rohan",
                    "Verma",
                    "+91-9876543212",
                    Role.ROLE_PATIENT
            ));
            PatientProfile p2Profile = patientProfileRepository.save(new PatientProfile(
                    p2User,
                    "MRN-IND-551029",
                    LocalDate.of(1985, 11, 23),
                    "Male",
                    "B+"
            ));
            testPatientId2 = p2Profile.getId();
        } else {
            testPatientId2 = patientProfileRepository.findByMrn("MRN-IND-551029").orElseThrow().getId();
        }
    }

    @Test
    @DisplayName("Phase 2A: Doctor search and filtering by specialty and rating")
    void testDoctorSearchAndFiltering() {
        List<DoctorDto> doctors = doctorService.searchDoctors("Priya", "Internal Medicine", BigDecimal.valueOf(1000.00), BigDecimal.valueOf(4.0));
        assertFalse(doctors.isEmpty());
        assertEquals("Internal Medicine", doctors.get(0).specialty());
        assertTrue(doctors.get(0).fullName().contains("Patel"));
    }

    @Test
    @DisplayName("Phase 2A: Doctor slot availability generation for Monday")
    void testDoctorSlotAvailability() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        List<TimeSlotDto> slots = doctorService.getAvailableTimeSlots(testDoctorId, nextMonday, ZoneId.of("UTC"));

        assertFalse(slots.isEmpty(), "Monday should have available 30-min consultation slots");
        TimeSlotDto firstSlot = slots.get(0);
        assertTrue(firstSlot.available());
        assertNotNull(firstSlot.formattedTime());
    }

    @Test
    @DisplayName("Phase 2A: Successful appointment booking with encounter generation and audit log")
    void testSuccessfulAppointmentBooking() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant slotTime = nextMonday.atTime(10, 0).atZone(ZoneId.of("UTC")).toInstant();

        BookingRequestDto request = new BookingRequestDto(
                testDoctorId,
                slotTime,
                30,
                "VIDEO",
                "Quarterly hypertension review",
                "2 weeks",
                "Takes Lisinopril 10mg",
                "Sunita Sharma",
                "+91-9876543211"
        );

        AppointmentDto booked = appointmentService.bookAppointment(testPatientId1, request);
        assertNotNull(booked.id());
        assertTrue(booked.encounterNumber().startsWith("APT-2026-"));
        assertEquals("CONFIRMED", booked.status());
        assertEquals("VIDEO", booked.modality());
        assertEquals(testPatientId1, booked.patientId());
        assertEquals(testDoctorId, booked.doctorId());
    }

    @Test
    @DisplayName("Phase 2A: Concurrency safeguard - Slot conflict rejected on duplicate booking")
    void testSlotConflictRejectionConcurrentBooking() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant slotTime = nextMonday.atTime(11, 30).atZone(ZoneId.of("UTC")).toInstant();

        BookingRequestDto request1 = new BookingRequestDto(
                testDoctorId,
                slotTime,
                30,
                "VIDEO",
                "First patient consult",
                "1 week",
                null,
                null,
                null
        );

        // First booking succeeds
        AppointmentDto first = appointmentService.bookAppointment(testPatientId1, request1);
        assertNotNull(first);

        // Second patient attempts to book the identical slot with the same doctor
        BookingRequestDto request2 = new BookingRequestDto(
                testDoctorId,
                slotTime,
                30,
                "VIDEO",
                "Second patient trying to book colliding slot",
                "3 days",
                null,
                null,
                null
        );

        SlotConflictException ex = assertThrows(SlotConflictException.class, () -> {
            appointmentService.bookAppointment(testPatientId2, request2);
        });

        assertTrue(ex.getMessage().contains("already reserved"), "Should throw slot conflict exception");
    }

    @Test
    @DisplayName("Phase 2A: Past slot booking rejection")
    void testPastSlotBookingRejection() {
        Instant pastTime = Instant.now().minus(2, ChronoUnit.DAYS);
        BookingRequestDto request = new BookingRequestDto(
                testDoctorId,
                pastTime,
                30,
                "VIDEO",
                "Past booking attempt",
                null,
                null,
                null,
                null
        );

        assertThrows(InvalidBookingException.class, () -> {
            appointmentService.bookAppointment(testPatientId1, request);
        });
    }

    @Test
    @DisplayName("Phase 2A: Reschedule appointment to new valid slot")
    void testRescheduleAppointment() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant originalTime = nextMonday.atTime(14, 0).atZone(ZoneId.of("UTC")).toInstant();
        Instant newTime = nextMonday.atTime(15, 0).atZone(ZoneId.of("UTC")).toInstant();

        BookingRequestDto req = new BookingRequestDto(
                testDoctorId,
                originalTime,
                30,
                "VIDEO",
                "Original booking",
                null, null, null, null
        );
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId1, req);

        RescheduleRequestDto rescheduleReq = new RescheduleRequestDto(newTime, "Patient requested schedule adjustment");
        AppointmentDto rescheduled = appointmentService.rescheduleAppointment(booked.id(), testPatientId1, "ROLE_PATIENT", rescheduleReq);

        assertEquals("RESCHEDULED", rescheduled.status());
        assertEquals(newTime, rescheduled.scheduledTime());
    }

    @Test
    @DisplayName("Phase 2A: Cancel appointment")
    void testCancelAppointment() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant time = nextMonday.atTime(16, 0).atZone(ZoneId.of("UTC")).toInstant();

        BookingRequestDto req = new BookingRequestDto(
                testDoctorId,
                time,
                30,
                "VIDEO",
                "Booking to be cancelled",
                null, null, null, null
        );
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId1, req);

        AppointmentDto cancelled = appointmentService.cancelAppointment(booked.id(), testPatientId1, "ROLE_PATIENT", "Conflict with personal schedule");
        assertEquals("CANCELLED", cancelled.status());
        assertEquals("Conflict with personal schedule", cancelled.cancellationReason());
    }

    @Test
    @DisplayName("Phase 2A: Object-level authorization - Patient cannot reschedule another patient's encounter")
    void testObjectLevelAccessEnforcement() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        Instant time = nextMonday.atTime(9, 30).atZone(ZoneId.of("UTC")).toInstant();

        BookingRequestDto req = new BookingRequestDto(
                testDoctorId,
                time,
                30,
                "VIDEO",
                "Aarav's appointment",
                null, null, null, null
        );
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId1, req);

        // Rohan tries to reschedule Aarav's appointment
        RescheduleRequestDto rescheduleReq = new RescheduleRequestDto(
                nextMonday.atTime(10, 30).atZone(ZoneId.of("UTC")).toInstant(),
                "Unauthorized attempt"
        );

        assertThrows(AccessDeniedException.class, () -> {
            appointmentService.rescheduleAppointment(booked.id(), testPatientId2, "ROLE_PATIENT", rescheduleReq);
        });
    }

    @Test
    @DisplayName("Phase 7 Verification: Synthetic doctor is excluded from search and booking when demo mode is disabled")
    void testSyntheticDoctorSearchAndBookingBlockedWhenDemoModeDisabled() {
        DoctorProfile doc = doctorProfileRepository.findById(testDoctorId).orElseThrow();
        doc.setSynthetic(true);
        doctorProfileRepository.save(doc);

        try {
            // Under normal demo mode (enabled)
            doctorService.setDemoModeEnabled(true);
            appointmentService.setDemoModeEnabled(true);
            List<DoctorDto> demoDoctors = doctorService.searchDoctors(null, null, null, null);
            assertTrue(demoDoctors.stream().anyMatch(d -> d.id().equals(testDoctorId) && d.isSynthetic()));

            // Disable demo mode (simulating production environment)
            doctorService.setDemoModeEnabled(false);
            appointmentService.setDemoModeEnabled(false);

            List<DoctorDto> prodDoctors = doctorService.searchDoctors(null, null, null, null);
            assertFalse(prodDoctors.stream().anyMatch(d -> d.id().equals(testDoctorId)));

            LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
            Instant time = nextMonday.atTime(11, 0).atZone(ZoneId.of("UTC")).toInstant();
            BookingRequestDto req = new BookingRequestDto(
                    testDoctorId,
                    time,
                    30,
                    "VIDEO",
                    "Production booking attempt for synthetic doctor",
                    null, null, null, null
            );

            InvalidBookingException ex = assertThrows(InvalidBookingException.class, () -> {
                appointmentService.bookAppointment(testPatientId1, req);
            });
            assertTrue(ex.getMessage().contains("simulated demo profile"));
        } finally {
            // Restore demo mode state
            doctorService.setDemoModeEnabled(true);
            appointmentService.setDemoModeEnabled(true);
            doc.setSynthetic(false);
            doctorProfileRepository.save(doc);
        }
    }
}
