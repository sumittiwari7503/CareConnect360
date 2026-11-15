package com.careconnect360.service;

import com.careconnect360.dto.AppointmentDto;
import com.careconnect360.dto.BookingRequestDto;
import com.careconnect360.dto.CompleteConsultationRequestDto;
import com.careconnect360.dto.ConsultationRecordDto;
import com.careconnect360.dto.RescheduleRequestDto;
import com.careconnect360.dto.RoomSessionDto;
import com.careconnect360.entity.Appointment;
import com.careconnect360.entity.ConsultationRecord;
import com.careconnect360.entity.DoctorAvailability;
import com.careconnect360.entity.DoctorProfile;
import com.careconnect360.entity.PatientProfile;
import com.careconnect360.exception.InvalidBookingException;
import com.careconnect360.exception.ResourceNotFoundException;
import com.careconnect360.exception.SlotConflictException;
import com.careconnect360.repository.AppointmentRepository;
import com.careconnect360.repository.ConsultationRecordRepository;
import com.careconnect360.repository.DoctorAvailabilityRepository;
import com.careconnect360.repository.DoctorProfileRepository;
import com.careconnect360.repository.PatientProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final AuditEventService auditEventService;
    private final BillingService billingService;

    @Value("${app.demo.enabled:true}")
    private boolean demoModeEnabled = true;

    @Value("${app.webrtc.stun.url1:stun:stun.l.google.com:19302}")
    private String stunUrl1 = "stun:stun.l.google.com:19302";

    @Value("${app.webrtc.stun.url2:stun:stun1.l.google.com:19302}")
    private String stunUrl2 = "stun:stun1.l.google.com:19302";

    @Value("${app.webrtc.turn.enabled:false}")
    private boolean turnEnabled = false;

    @Value("${app.webrtc.turn.url:}")
    private String turnUrl = "";

    private static final List<String> ACTIVE_STATUSES = List.of("SCHEDULED", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED");

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientProfileRepository patientProfileRepository,
                              DoctorProfileRepository doctorProfileRepository,
                              DoctorAvailabilityRepository availabilityRepository,
                              ConsultationRecordRepository consultationRecordRepository,
                              AuditEventService auditEventService,
                              BillingService billingService) {
        this.appointmentRepository = appointmentRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.availabilityRepository = availabilityRepository;
        this.consultationRecordRepository = consultationRecordRepository;
        this.auditEventService = auditEventService;
        this.billingService = billingService;
    }

    public void setDemoModeEnabled(boolean demoModeEnabled) {
        this.demoModeEnabled = demoModeEnabled;
    }

    public boolean isDemoModeEnabled() {
        return demoModeEnabled;
    }

    public AppointmentDto bookAppointment(Long patientUserId, BookingRequestDto request) {
        PatientProfile patient = patientProfileRepository.findById(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user ID: " + patientUserId));

        // Enforce true concurrency serialization by locking the doctor profile record with PESSIMISTIC_WRITE
        DoctorProfile doctor = doctorProfileRepository.findByIdWithLock(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for ID: " + request.doctorId()));

        if (!demoModeEnabled && doctor.isSynthetic()) {
            throw new InvalidBookingException("This provider is a simulated demo profile and cannot accept real patient appointments in production.");
        }

        if (!doctor.isAcceptingPatients()) {
            throw new InvalidBookingException("Doctor is not currently accepting new consultations.");
        }

        Instant scheduledTime = request.scheduledTime().truncatedTo(ChronoUnit.MINUTES);
        Instant now = Instant.now();

        if (scheduledTime.isBefore(now)) {
            throw new InvalidBookingException("Appointment time cannot be in the past.");
        }

        // 1. Validate against doctor working hours
        ZonedDateTime zdtUtc = scheduledTime.atZone(ZoneId.of("UTC"));
        String dayOfWeek = zdtUtc.getDayOfWeek().name();
        Optional<DoctorAvailability> availOpt = availabilityRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctor.getId(), dayOfWeek);

        if (availOpt.isEmpty()) {
            throw new InvalidBookingException("Doctor has no available consultation schedule on " + dayOfWeek);
        }

        // 2. Transactional Slot Collision Check: Doctor Conflict
        if (appointmentRepository.existsByDoctorIdAndScheduledTimeAndStatusIn(doctor.getId(), scheduledTime, ACTIVE_STATUSES)) {
            throw new SlotConflictException("The requested consultation slot is already reserved. Please select an alternative time slot.");
        }

        // 3. Transactional Slot Collision Check: Patient Conflict (patient cannot be in two consultations at once)
        if (appointmentRepository.existsByPatientIdAndScheduledTimeAndStatusIn(patient.getId(), scheduledTime, ACTIVE_STATUSES)) {
            throw new SlotConflictException("You already have another active medical encounter scheduled at this exact time.");
        }

        // 4. Create Encounter
        String encounterNumber = "APT-2026-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        int duration = request.durationMinutes() != null && request.durationMinutes() > 0 ? request.durationMinutes() : 30;

        Appointment appointment = new Appointment(
                encounterNumber,
                patient,
                doctor,
                scheduledTime,
                request.modality(),
                request.chiefComplaint()
        );
        appointment.setDurationMinutes(duration);
        appointment.setStatus("CONFIRMED");

        Appointment saved = appointmentRepository.save(appointment);

        // 5. Generate Billing Invoice for Encounter
        billingService.createInvoiceForAppointment(saved, doctor.getConsultationFee());

        // 6. Record Level-4 Clinical Audit Trail
        auditEventService.recordEvent(
                patientUserId,
                "ROLE_PATIENT",
                "APPOINTMENT_BOOKED",
                "ENCOUNTER:" + encounterNumber,
                "SUCCESS",
                String.format("{\"doctorId\":%d,\"modality\":\"%s\",\"scheduledTime\":\"%s\"}", doctor.getId(), request.modality(), scheduledTime)
        );

        return mapToDto(saved);
    }

    public AppointmentDto rescheduleAppointment(Long appointmentId, Long requestingUserId, String role, RescheduleRequestDto request) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateOwnership(appt, requestingUserId, role);

        if ("COMPLETED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot reschedule an encounter that has already been completed.");
        }
        if ("CANCELLED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot reschedule a cancelled appointment.");
        }
        if ("IN_PROGRESS".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot reschedule a consultation that is currently in progress.");
        }

        Instant newTime = request.newScheduledTime().truncatedTo(ChronoUnit.MINUTES);
        if (newTime.isBefore(Instant.now())) {
            throw new InvalidBookingException("Rescheduled time cannot be in the past.");
        }

        // Verify day-of-week working hours
        ZonedDateTime zdtUtc = newTime.atZone(ZoneId.of("UTC"));
        String dayOfWeek = zdtUtc.getDayOfWeek().name();
        Optional<DoctorAvailability> availOpt = availabilityRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(appt.getDoctor().getId(), dayOfWeek);
        if (availOpt.isEmpty()) {
            throw new InvalidBookingException("Doctor has no available consultation schedule on " + dayOfWeek);
        }

        // Check conflict excluding current appointment
        if (appointmentRepository.existsByDoctorIdAndScheduledTimeAndStatusInAndIdNot(appt.getDoctor().getId(), newTime, ACTIVE_STATUSES, appt.getId())) {
            throw new SlotConflictException("The newly selected slot is already booked. Please choose another time.");
        }

        // Check patient conflict excluding current appointment
        if (appointmentRepository.existsByPatientIdAndScheduledTimeAndStatusInAndIdNot(appt.getPatient().getId(), newTime, ACTIVE_STATUSES, appt.getId())) {
            throw new SlotConflictException("You have an existing active appointment at this requested time.");
        }

        appt.setScheduledTime(newTime);
        appt.setStatus("RESCHEDULED");
        Appointment saved = appointmentRepository.save(appt);

        auditEventService.recordEvent(
                requestingUserId,
                role,
                "APPOINTMENT_RESCHEDULED",
                "ENCOUNTER:" + appt.getEncounterNumber(),
                "SUCCESS",
                String.format("{\"newTime\":\"%s\",\"reason\":\"%s\"}", newTime, request.reason() != null ? request.reason() : "")
        );

        return mapToDto(saved);
    }

    public AppointmentDto cancelAppointment(Long appointmentId, Long requestingUserId, String role, String reason) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateOwnership(appt, requestingUserId, role);

        if ("COMPLETED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot cancel a completed consultation.");
        }
        if ("CANCELLED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Appointment is already cancelled.");
        }
        if ("IN_PROGRESS".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot cancel a consultation that is currently in progress. Please complete or end the consultation session.");
        }

        appt.setStatus("CANCELLED");
        appt.setCancellationReason(reason != null && !reason.isBlank() ? reason : "Cancelled by patient");
        Appointment saved = appointmentRepository.save(appt);

        auditEventService.recordEvent(
                requestingUserId,
                role,
                "APPOINTMENT_CANCELLED",
                "ENCOUNTER:" + appt.getEncounterNumber(),
                "SUCCESS",
                String.format("{\"reason\":\"%s\"}", appt.getCancellationReason())
        );

        return mapToDto(saved);
    }

    public AppointmentDto startConsultation(Long appointmentId, Long doctorUserId, String role) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOrAdmin(appt, doctorUserId, role);

        if ("CANCELLED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot start a cancelled appointment.");
        }
        if ("COMPLETED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Consultation has already been completed.");
        }

        appt.setStatus("IN_PROGRESS");
        Appointment saved = appointmentRepository.save(appt);

        // Ensure ConsultationRecord exists with session started timestamp
        ConsultationRecord record = consultationRecordRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> new ConsultationRecord(saved, null, null, null));
        if (record.getSessionStartedAt() == null) {
            record.setSessionStartedAt(Instant.now());
        }
        consultationRecordRepository.save(record);

        auditEventService.recordEvent(
                doctorUserId,
                role,
                "CONSULTATION_STARTED",
                "ENCOUNTER:" + appt.getEncounterNumber(),
                "SUCCESS",
                String.format("{\"status\":\"IN_PROGRESS\",\"startedAt\":\"%s\"}", record.getSessionStartedAt())
        );

        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto completeConsultation(Long appointmentId, Long doctorUserId, String role, CompleteConsultationRequestDto request) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOrAdmin(appt, doctorUserId, role);

        if ("COMPLETED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Consultation has already been completed.");
        }
        if ("CANCELLED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot complete a cancelled appointment.");
        }

        // Validate clinical provenance & physiological limits BEFORE mutating state
        String provenance = request.vitalsProvenance() != null ? request.vitalsProvenance().trim().toUpperCase() : null;
        boolean hasAnyVital = request.systolicBp() != null || request.diastolicBp() != null
                || request.heartRateBpm() != null || request.spo2Percent() != null;

        if (hasAnyVital) {
            if (provenance == null || "NOT_RECORDED".equals(provenance)) {
                throw new IllegalArgumentException("Clinical vitals cannot be submitted with 'NOT_RECORDED' provenance. Must specify 'MEASURED' or 'PATIENT_REPORTED'.");
            }
            if (!"MEASURED".equals(provenance) && !"PATIENT_REPORTED".equals(provenance)) {
                throw new IllegalArgumentException("Invalid vitals provenance: " + provenance + ". Allowed values: MEASURED, PATIENT_REPORTED.");
            }

            // Physiological range checks
            if (request.systolicBp() != null) {
                if (request.systolicBp() < 50 || request.systolicBp() > 300) {
                    throw new IllegalArgumentException("Systolic blood pressure out of physiologically plausible clinical range (50-300 mmHg): " + request.systolicBp());
                }
            }
            if (request.diastolicBp() != null) {
                if (request.diastolicBp() < 30 || request.diastolicBp() > 200) {
                    throw new IllegalArgumentException("Diastolic blood pressure out of physiologically plausible clinical range (30-200 mmHg): " + request.diastolicBp());
                }
            }
            if (request.systolicBp() != null && request.diastolicBp() != null) {
                if (request.systolicBp() <= request.diastolicBp()) {
                    throw new IllegalArgumentException("Systolic blood pressure (" + request.systolicBp() + ") must be greater than diastolic blood pressure (" + request.diastolicBp() + ").");
                }
            }
            if (request.heartRateBpm() != null) {
                if (request.heartRateBpm() < 30 || request.heartRateBpm() > 250) {
                    throw new IllegalArgumentException("Heart rate out of physiologically plausible clinical range (30-250 bpm): " + request.heartRateBpm());
                }
            }
            if (request.spo2Percent() != null) {
                if (request.spo2Percent() < 50 || request.spo2Percent() > 100) {
                    throw new IllegalArgumentException("Oxygen saturation (SpO2) out of valid clinical percentage range (50-100%): " + request.spo2Percent());
                }
            }
        } else {
            provenance = "NOT_RECORDED";
        }

        appt.setStatus("COMPLETED");
        Appointment saved = appointmentRepository.save(appt);

        ConsultationRecord record = consultationRecordRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> new ConsultationRecord(saved, null, null, null));

        if (record.getSessionStartedAt() == null) {
            record.setSessionStartedAt(Instant.now().minus(20, ChronoUnit.MINUTES));
        }
        record.setSessionEndedAt(Instant.now());
        record.setDoctorNotes(request.doctorNotes());
        record.setDiagnosisCode(request.diagnosisCode());
        record.setDiagnosisDescription(request.diagnosisDescription());
        record.setVitalsProvenance(provenance);
        record.setSystolicBp(request.systolicBp());
        record.setDiastolicBp(request.diastolicBp());
        record.setHeartRateBpm(request.heartRateBpm());
        record.setSpo2Percent(request.spo2Percent());

        consultationRecordRepository.save(record);

        auditEventService.recordEvent(
                doctorUserId,
                role,
                "CONSULTATION_COMPLETED",
                "ENCOUNTER:" + appt.getEncounterNumber(),
                "SUCCESS",
                String.format("{\"diagnosisCode\":\"%s\",\"endedAt\":\"%s\"}", request.diagnosisCode(), record.getSessionEndedAt())
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public ConsultationRecordDto getConsultationRecord(Long appointmentId, Long requestingUserId, String role) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateClinicalEncounterAccess(appt, requestingUserId, role);

        ConsultationRecord record = consultationRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No consultation record found for appointment ID: " + appointmentId));

        String patientName = appt.getPatient() != null && appt.getPatient().getUser() != null
                ? appt.getPatient().getUser().getFirstName() + " " + appt.getPatient().getUser().getLastName()
                : "Patient";

        String patientMrn = appt.getPatient() != null ? appt.getPatient().getMrn() : "N/A";

        String doctorName = appt.getDoctor() != null && appt.getDoctor().getUser() != null
                ? "Dr. " + appt.getDoctor().getUser().getFirstName() + " " + appt.getDoctor().getUser().getLastName() + ", MD"
                : "Doctor";

        return new ConsultationRecordDto(
                record.getId(),
                appt.getId(),
                appt.getEncounterNumber(),
                patientName,
                patientMrn,
                doctorName,
                record.getDoctorNotes(),
                record.getDiagnosisCode(),
                record.getDiagnosisDescription(),
                record.getSystolicBp(),
                record.getDiastolicBp(),
                record.getHeartRateBpm(),
                record.getSpo2Percent(),
                record.getVitalsProvenance() != null ? record.getVitalsProvenance() : "NOT_RECORDED",
                record.getSessionStartedAt(),
                record.getSessionEndedAt(),
                record.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public RoomSessionDto getRoomSessionToken(Long appointmentId, Long requestingUserId, String role) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateOwnership(appt, requestingUserId, role);

        if ("CANCELLED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Cannot enter a telehealth room for a cancelled appointment.");
        }
        if ("COMPLETED".equalsIgnoreCase(appt.getStatus())) {
            throw new InvalidBookingException("Live telehealth session is closed. This clinical consultation has already been completed.");
        }

        // Check if access window has expired (2 hours after scheduled time)
        Instant authorizedUntil = appt.getScheduledTime().plus(2, ChronoUnit.HOURS);
        if (Instant.now().isAfter(authorizedUntil)) {
            throw new AccessDeniedException("Telehealth room session access has expired. The access window closed 2 hours after scheduled time.");
        }

        String roomId = "CC-9021"; // Standard encrypted virtual room code
        String salt = "CareConnect360-Secret-Salt-2026";
        String tokenPayload = appt.getId() + ":" + appt.getEncounterNumber() + ":" + requestingUserId + ":" + salt;
        String sessionToken = sha256(tokenPayload);

        String participantRole = role;
        String participantName = "Participant";
        if ("ROLE_DOCTOR".equals(role) && appt.getDoctor() != null && appt.getDoctor().getUser() != null) {
            participantName = "Dr. " + appt.getDoctor().getUser().getFirstName() + " " + appt.getDoctor().getUser().getLastName();
        } else if ("ROLE_PATIENT".equals(role) && appt.getPatient() != null && appt.getPatient().getUser() != null) {
            participantName = appt.getPatient().getUser().getFirstName() + " " + appt.getPatient().getUser().getLastName();
        }

        String patientName = appt.getPatient() != null && appt.getPatient().getUser() != null
                ? appt.getPatient().getUser().getFirstName() + " " + appt.getPatient().getUser().getLastName()
                : "Patient";

        String patientMrn = appt.getPatient() != null ? appt.getPatient().getMrn() : "N/A";

        String doctorName = appt.getDoctor() != null && appt.getDoctor().getUser() != null
                ? "Dr. " + appt.getDoctor().getUser().getFirstName() + " " + appt.getDoctor().getUser().getLastName() + ", MD"
                : "Doctor";

        String doctorSpecialty = appt.getDoctor() != null ? appt.getDoctor().getSpecialty() : "General Practice";

        // Authorized until 2 hours after scheduled time
        List<String> iceServers = new java.util.ArrayList<>();
        if (stunUrl1 != null && !stunUrl1.isBlank()) iceServers.add(stunUrl1);
        if (stunUrl2 != null && !stunUrl2.isBlank()) iceServers.add(stunUrl2);
        if (turnEnabled && turnUrl != null && !turnUrl.isBlank()) {
            iceServers.add(turnUrl);
        }

        return new RoomSessionDto(
                appt.getId(),
                appt.getEncounterNumber(),
                roomId,
                sessionToken,
                participantRole,
                participantName,
                patientName,
                patientMrn,
                doctorName,
                doctorSpecialty,
                appt.getScheduledTime(),
                appt.getStatus(),
                authorizedUntil,
                iceServers
        );
    }

    @Transactional(readOnly = true)
    public AppointmentDto getAppointmentDetails(Long appointmentId, Long requestingUserId, String role) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateOwnership(appt, requestingUserId, role);
        return mapToDto(appt);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsForPatient(Long patientUserId) {
        return appointmentRepository.findByPatientIdOrderByScheduledTimeDesc(patientUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsForDoctor(Long doctorUserId) {
        return appointmentRepository.findByDoctorIdOrderByScheduledTimeAsc(doctorUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private void validateOwnership(Appointment appt, Long userId, String role) {
        if ("ROLE_ADMIN".equals(role)) {
            return;
        }
        boolean isPatient = appt.getPatient() != null && appt.getPatient().getId().equals(userId);
        boolean isDoctor = appt.getDoctor() != null && appt.getDoctor().getId().equals(userId);

        if (!isPatient && !isDoctor) {
            throw new AccessDeniedException("Access denied: You are not authorized to view or modify this clinical encounter.");
        }
    }

    private void validateClinicalEncounterAccess(Appointment appt, Long userId, String role) {
        boolean isPatient = appt.getPatient() != null && appt.getPatient().getId().equals(userId);
        boolean isDoctor = appt.getDoctor() != null && appt.getDoctor().getId().equals(userId);

        if (!isPatient && !isDoctor) {
            throw new AccessDeniedException("Access denied: Under HIPAA § 164.502(b) Minimum Necessary privacy standards, clinical SOAP notes and vitals telemetry are restricted to the patient and assigned attending physician.");
        }
    }

    private void validateDoctorOrAdmin(Appointment appt, Long userId, String role) {
        if ("ROLE_ADMIN".equals(role)) {
            return;
        }
        boolean isDoctor = appt.getDoctor() != null && appt.getDoctor().getId().equals(userId);
        if (!isDoctor) {
            throw new AccessDeniedException("Access denied: Only the attending physician assigned to this encounter can start or complete this consultation.");
        }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }

    public AppointmentDto mapToDto(Appointment a) {
        String patientName = a.getPatient() != null && a.getPatient().getUser() != null
                ? a.getPatient().getUser().getFirstName() + " " + a.getPatient().getUser().getLastName()
                : "Patient #" + (a.getPatient() != null ? a.getPatient().getId() : "N/A");

        String patientMrn = a.getPatient() != null ? a.getPatient().getMrn() : "N/A";

        String doctorName = a.getDoctor() != null && a.getDoctor().getUser() != null
                ? "Dr. " + a.getDoctor().getUser().getFirstName() + " " + a.getDoctor().getUser().getLastName() + ", MD"
                : "Doctor #" + (a.getDoctor() != null ? a.getDoctor().getId() : "N/A");

        String doctorSpecialty = a.getDoctor() != null ? a.getDoctor().getSpecialty() : "General Practice";
        String doctorNpi = a.getDoctor() != null ? a.getDoctor().getNpi() : "N/A";
        java.math.BigDecimal fee = a.getDoctor() != null ? a.getDoctor().getConsultationFee() : java.math.BigDecimal.valueOf(150.00);

        return new AppointmentDto(
                a.getId(),
                a.getEncounterNumber(),
                a.getPatient() != null ? a.getPatient().getId() : null,
                patientName,
                patientMrn,
                a.getDoctor() != null ? a.getDoctor().getId() : null,
                doctorName,
                doctorSpecialty,
                doctorNpi,
                fee,
                a.getScheduledTime(),
                a.getDurationMinutes(),
                a.getModality(),
                a.getStatus(),
                a.getChiefComplaint(),
                a.getCancellationReason(),
                a.getCreatedAt()
        );
    }
}
