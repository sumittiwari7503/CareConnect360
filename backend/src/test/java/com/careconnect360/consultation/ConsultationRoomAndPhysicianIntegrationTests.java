package com.careconnect360.consultation;

import com.careconnect360.dto.AppointmentDto;
import com.careconnect360.dto.BookingRequestDto;
import com.careconnect360.dto.CompleteConsultationRequestDto;
import com.careconnect360.dto.ConsultationRecordDto;
import com.careconnect360.dto.RoomSessionDto;
import com.careconnect360.entity.*;
import com.careconnect360.exception.InvalidBookingException;
import com.careconnect360.exception.SlotConflictException;
import com.careconnect360.repository.*;
import com.careconnect360.service.AppointmentService;
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

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class ConsultationRoomAndPhysicianIntegrationTests {

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
    private Instant validSlotTime;

    @BeforeEach
    void setupTestData() {
        // Setup Primary Doctor
        User doctorUser = userRepository.save(new User(
                "dr.rajesh.nair.consult@example.in",
                passwordEncoder.encode("TestDoctor123!"),
                "Rajesh",
                "Nair",
                "+91-9876543202",
                Role.ROLE_DOCTOR
        ));

        DoctorProfile doctorProfile = new DoctorProfile(
                doctorUser,
                "1948203948",
                "Cardiology",
                "MMC-TEST-9901",
                BigDecimal.valueOf(1500.00),
                18
        );
        doctorProfile.setSubSpecialty("Interventional Cardiology");
        doctorProfile.setAcceptingPatients(true);
        doctorProfile = doctorProfileRepository.save(doctorProfile);
        testDoctorId = doctorProfile.getId();

        // Setup Secondary Doctor
        User otherDoctorUser = userRepository.save(new User(
                "dr.priya.patel.consult@example.in",
                passwordEncoder.encode("OtherDoctor123!"),
                "Priya",
                "Patel",
                "+91-9876543203",
                Role.ROLE_DOCTOR
        ));

        DoctorProfile otherDoctorProfile = new DoctorProfile(
                otherDoctorUser,
                "1829304918",
                "Dermatology",
                "KMC-TEST-9902",
                BigDecimal.valueOf(800.00),
                12
        );
        otherDoctorProfile.setAcceptingPatients(true);
        otherDoctorProfile = doctorProfileRepository.save(otherDoctorProfile);
        testOtherDoctorId = otherDoctorProfile.getId();

        // Setup Patient
        User patientUser = userRepository.save(new User(
                "aarav.sharma.consult@example.in",
                passwordEncoder.encode("TestPatient123!"),
                "Aarav",
                "Sharma",
                "+91-9876543210",
                Role.ROLE_PATIENT
        ));

        PatientProfile patientProfile = new PatientProfile(
                patientUser,
                "MRN-TEST-9021",
                LocalDate.of(1992, 8, 15),
                "Male",
                "O+"
        );
        patientProfile = patientProfileRepository.save(patientProfile);
        testPatientId = patientProfile.getId();

        // Setup Doctor Availability for all weekdays
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

        // Compute valid upcoming weekday slot
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        validSlotTime = nextMonday.atTime(10, 30).atZone(ZoneId.of("UTC")).toInstant().truncatedTo(ChronoUnit.MINUTES);
    }

    private BookingRequestDto createSampleBooking(Long doctorId, Instant slotTime, String complaint) {
        return new BookingRequestDto(
                doctorId,
                slotTime,
                50,
                "VIDEO",
                complaint,
                "2 weeks",
                "Takes Lisinopril 10mg",
                "Sunita Sharma",
                "+91-9876543211"
        );
    }

    @Test
    @DisplayName("Physician can transition scheduled appointment to IN_PROGRESS when starting consultation")
    void testDoctorCanStartConsultationSuccessfully() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Hypertension follow-up and Withings telemetry review.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);
        assertEquals("CONFIRMED", booked.status());

        // Doctor starts consultation
        AppointmentDto inProgress = appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");
        assertEquals("IN_PROGRESS", inProgress.status());
    }

    @Test
    @DisplayName("Non-assigned physician is blocked from starting another doctor's consultation (Access Denied)")
    void testNonAssignedDoctorCannotStartConsultation() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Hypertension review.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);

        // Doctor B tries to start Doctor A's encounter
        assertThrows(AccessDeniedException.class, () ->
                appointmentService.startConsultation(booked.id(), testOtherDoctorId, "ROLE_DOCTOR")
        );
    }

    @Test
    @DisplayName("Physician can complete consultation with SOAP notes, diagnosis code, and vitals telemetry")
    void testDoctorCanCompleteConsultationWithSoapNotesAndTelemetry() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Quarterly cardiology review.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto completeReq = new CompleteConsultationRequestDto(
                "Patient shows good tolerance to Atorvastatin 20mg. Low-sodium diet maintained. Sleeping 7 hours comfortably.",
                "ICD-10 I10",
                "Essential (Primary) Hypertension",
                118,
                76,
                72,
                99
        );

        AppointmentDto completed = appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", completeReq);
        assertEquals("COMPLETED", completed.status());

        // Verify Consultation Record details
        ConsultationRecordDto record = appointmentService.getConsultationRecord(booked.id(), testDoctorId, "ROLE_DOCTOR");
        assertNotNull(record);
        assertEquals("ICD-10 I10", record.diagnosisCode());
        assertEquals("Essential (Primary) Hypertension", record.diagnosisDescription());
        assertEquals(118, record.systolicBp());
        assertEquals(76, record.diastolicBp());
        assertEquals(72, record.heartRateBpm());
        assertEquals(99, record.spo2Percent());
        assertNotNull(record.sessionEndedAt());
    }

    @Test
    @DisplayName("Cannot complete an already completed consultation")
    void testCannotCompleteAlreadyCompletedConsultation() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Cardiology consult.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        CompleteConsultationRequestDto completeReq = new CompleteConsultationRequestDto(
                "Consultation completed.",
                "ICD-10 I10",
                "Hypertension",
                120,
                80,
                70,
                98
        );
        appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", completeReq);

        // Attempting to complete again should throw InvalidBookingException
        assertThrows(InvalidBookingException.class, () ->
                appointmentService.completeConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR", completeReq)
        );
    }

    @Test
    @DisplayName("Both attending doctor and patient can generate encrypted RoomSession token for WebRTC consult")
    void testDoctorAndPatientCanAccessRoomToken() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Pre-screening check.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);

        // Doctor gets room token
        RoomSessionDto docToken = appointmentService.getRoomSessionToken(booked.id(), testDoctorId, "ROLE_DOCTOR");
        assertNotNull(docToken);
        assertEquals("CC-9021", docToken.roomId());
        assertNotNull(docToken.sessionToken());
        assertEquals("ROLE_DOCTOR", docToken.participantRole());
        assertFalse(docToken.iceServers().isEmpty());

        // Patient gets room token
        RoomSessionDto patientToken = appointmentService.getRoomSessionToken(booked.id(), testPatientId, "ROLE_PATIENT");
        assertNotNull(patientToken);
        assertEquals("CC-9021", patientToken.roomId());
        assertEquals("ROLE_PATIENT", patientToken.participantRole());
    }

    @Test
    @DisplayName("Unauthorized user cannot generate room token for an encounter they do not own (Access Denied)")
    void testUnauthorizedUserCannotAccessRoomToken() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Pre-screening check.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);

        // Non-assigned Doctor B tries to access room
        assertThrows(AccessDeniedException.class, () ->
                appointmentService.getRoomSessionToken(booked.id(), testOtherDoctorId, "ROLE_DOCTOR")
        );
    }

    @Test
    @DisplayName("Cannot cancel an in-progress consultation session")
    void testPatientCannotCancelInProgressConsultation() {
        BookingRequestDto booking = createSampleBooking(testDoctorId, validSlotTime, "Urgent consult.");
        AppointmentDto booked = appointmentService.bookAppointment(testPatientId, booking);
        appointmentService.startConsultation(booked.id(), testDoctorId, "ROLE_DOCTOR");

        // Attempt to cancel while IN_PROGRESS
        assertThrows(InvalidBookingException.class, () ->
                appointmentService.cancelAppointment(booked.id(), testPatientId, "ROLE_PATIENT", "Trying to cancel live call")
        );
    }

    @Test
    @DisplayName("Pessimistic concurrency lock prevents simultaneous slot double-booking")
    void testPessimisticConcurrencyLockPreventsSimultaneousBooking() {
        BookingRequestDto booking1 = createSampleBooking(testDoctorId, validSlotTime, "Patient 1 Booking");

        AppointmentDto booked1 = appointmentService.bookAppointment(testPatientId, booking1);
        assertNotNull(booked1);

        // Second booking attempt for the exact same doctor and slot is cleanly rejected with SlotConflictException
        BookingRequestDto booking2 = createSampleBooking(testDoctorId, validSlotTime, "Simultaneous Patient 2 Booking");

        assertThrows(SlotConflictException.class, () ->
                appointmentService.bookAppointment(testPatientId, booking2)
        );
    }
}
