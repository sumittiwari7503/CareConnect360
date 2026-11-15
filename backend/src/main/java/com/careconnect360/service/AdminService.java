package com.careconnect360.service;

import com.careconnect360.dto.*;
import com.careconnect360.entity.*;
import com.careconnect360.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditEventRepository auditEventRepository;
    private final AuditEventService auditEventService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            InvoiceRepository invoiceRepository,
            AuditEventRepository auditEventRepository,
            AuditEventService auditEventService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditEventRepository = auditEventRepository;
        this.auditEventService = auditEventService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AdminDashboardMetricsDto getPlatformMetrics() {
        long registeredPatients = patientProfileRepository.count();
        long credentialedPhysicians = doctorProfileRepository.countByCredentialingStatus("APPROVED");
        long pendingCredentialing = doctorProfileRepository.countByCredentialingStatus("PENDING");
        long totalAppointments = appointmentRepository.count();
        long completedConsultations = appointmentRepository.findByStatus("COMPLETED").size();

        BigDecimal totalRevenue = invoiceRepository.findAll().stream()
                .filter(inv -> "PAID".equalsIgnoreCase(inv.getStatus()))
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long auditEventsCount = auditEventRepository.count();

        return new AdminDashboardMetricsDto(
                registeredPatients,
                credentialedPhysicians,
                pendingCredentialing,
                totalAppointments,
                completedConsultations,
                totalRevenue,
                99.98,
                auditEventsCount
        );
    }

    @Transactional(readOnly = true)
    public List<DoctorCredentialingDto> getCredentialingQueue(String status) {
        List<DoctorProfile> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = doctorProfileRepository.findByCredentialingStatus(status.toUpperCase());
        } else {
            list = doctorProfileRepository.findAll();
        }
        return list.stream().map(this::toCredentialingDto).toList();
    }

    @Transactional
    public DoctorCredentialingDto verifyDoctorCredentials(Long doctorId, VerifyCredentialRequestDto request, Long adminId, String adminRole) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile not found with ID: " + doctorId));

        String action = request.action().toUpperCase();
        switch (action) {
            case "APPROVE" -> {
                doctor.setCredentialingStatus("APPROVED");
                doctor.setVerifiedAt(Instant.now());
                doctor.setVerifiedBy(adminId);
                doctor.setRejectionReason(null);
            }
            case "REJECT" -> {
                if (request.notes() == null || request.notes().trim().isEmpty()) {
                    throw new IllegalArgumentException("Rejection reason is required when rejecting doctor credentials.");
                }
                doctor.setCredentialingStatus("REJECTED");
                doctor.setRejectionReason(request.notes().trim());
                doctor.setVerifiedAt(Instant.now());
                doctor.setVerifiedBy(adminId);
            }
            case "SUSPEND" -> {
                doctor.setCredentialingStatus("SUSPENDED");
                if (request.notes() != null && !request.notes().isBlank()) {
                    doctor.setRejectionReason(request.notes().trim());
                }
            }
            case "REACTIVATE" -> {
                doctor.setCredentialingStatus("APPROVED");
                doctor.setRejectionReason(null);
            }
            default -> throw new IllegalArgumentException("Unsupported credential verification action: " + action);
        }

        DoctorProfile saved = doctorProfileRepository.save(doctor);

        String details = "{\"doctorId\":" + doctorId + ",\"action\":\"" + action + "\",\"notes\":\"" + (request.notes() != null ? request.notes() : "") + "\"}";
        auditEventService.recordEvent(
                adminId,
                adminRole,
                "ADMIN_CREDENTIAL_" + action,
                "DOCTOR_PROFILE:" + doctorId,
                "SUCCESS",
                details
        );

        return toCredentialingDto(saved);
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryDto> getAllDoctors(String search, String status) {
        List<DoctorProfile> doctors = doctorProfileRepository.findAll();
        return doctors.stream()
                .filter(d -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        if (!status.equalsIgnoreCase(d.getCredentialingStatus())) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        String fullName = (d.getUser().getFirstName() + " " + d.getUser().getLastName()).toLowerCase();
                        return fullName.contains(q) || d.getNpi().contains(q) || d.getSpecialty().toLowerCase().contains(q);
                    }
                    return true;
                })
                .map(d -> new AdminUserSummaryDto(
                        d.getId(),
                        d.getUser().getEmail(),
                        d.getUser().getFirstName(),
                        d.getUser().getLastName(),
                        d.getUser().getFirstName() + " " + d.getUser().getLastName(),
                        d.getUser().getPhoneNumber(),
                        d.getUser().getRole().name(),
                        d.getUser().isActive(),
                        d.getUser().isMfaEnabled(),
                        d.getCreatedAt(),
                        null,
                        d.getNpi(),
                        d.getSpecialty(),
                        null,
                        null
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryDto> getAllPatients(String search) {
        List<PatientProfile> patients = patientProfileRepository.findAll();
        return patients.stream()
                .filter(p -> {
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        String fullName = (p.getUser().getFirstName() + " " + p.getUser().getLastName()).toLowerCase();
                        return fullName.contains(q) || p.getMrn().toLowerCase().contains(q);
                    }
                    return true;
                })
                .map(p -> new AdminUserSummaryDto(
                        p.getId(),
                        p.getUser().getEmail(),
                        p.getUser().getFirstName(),
                        p.getUser().getLastName(),
                        p.getUser().getFirstName() + " " + p.getUser().getLastName(),
                        p.getUser().getPhoneNumber(),
                        p.getUser().getRole().name(),
                        p.getUser().isActive(),
                        p.getUser().isMfaEnabled(),
                        p.getCreatedAt(),
                        p.getMrn(),
                        null,
                        null,
                        p.getInsuranceProvider(),
                        p.getEmergencyContactName()
                ))
                .toList();
    }

    @Transactional
    public AdminUserSummaryDto toggleUserStatus(Long userId, boolean active, String reason, Long adminId, String adminRole) {
        if (userId.equals(adminId)) {
            throw new IllegalStateException("Security Violation: Administrator cannot alter status of their own active session account.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setActive(active);
        User saved = userRepository.save(user);

        String details = "{\"targetUserId\":" + userId + ",\"newActiveStatus\":" + active + ",\"reason\":\"" + (reason != null ? reason : "") + "\"}";
        auditEventService.recordEvent(
                adminId,
                adminRole,
                active ? "ADMIN_USER_UNLOCK" : "ADMIN_USER_LOCK",
                "USER:" + userId,
                "SUCCESS",
                details
        );

        String mrn = null;
        String npi = null;
        String specialty = null;
        String insurance = null;
        String emergencyContact = null;

        if (saved.getRole() == Role.ROLE_PATIENT) {
            patientProfileRepository.findById(userId).ifPresent(p -> {
                // local effectively final copies
            });
            PatientProfile p = patientProfileRepository.findById(userId).orElse(null);
            if (p != null) {
                mrn = p.getMrn();
                insurance = p.getInsuranceProvider();
                emergencyContact = p.getEmergencyContactName();
            }
        } else if (saved.getRole() == Role.ROLE_DOCTOR) {
            DoctorProfile d = doctorProfileRepository.findById(userId).orElse(null);
            if (d != null) {
                npi = d.getNpi();
                specialty = d.getSpecialty();
            }
        }

        return new AdminUserSummaryDto(
                saved.getId(),
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getFirstName() + " " + saved.getLastName(),
                saved.getPhoneNumber(),
                saved.getRole().name(),
                saved.isActive(),
                saved.isMfaEnabled(),
                saved.getCreatedAt(),
                mrn,
                npi,
                specialty,
                insurance,
                emergencyContact
        );
    }

    @Transactional
    public DoctorCredentialingDto onboardDoctor(AdminCreateDoctorRequestDto dto, Long adminId, String adminRole) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Email already registered: " + dto.email());
        }
        if (doctorProfileRepository.findByNpi(dto.npi()).isPresent()) {
            throw new IllegalArgumentException("NPI already registered: " + dto.npi());
        }

        User user = new User(
                dto.email(),
                passwordEncoder.encode(dto.password()),
                dto.firstName(),
                dto.lastName(),
                dto.phoneNumber(),
                Role.ROLE_DOCTOR
        );
        User savedUser = userRepository.save(user);

        DoctorProfile profile = new DoctorProfile(
                savedUser,
                dto.npi(),
                dto.specialty(),
                dto.licenseNumber(),
                dto.consultationFee(),
                dto.experienceYears() != null ? dto.experienceYears() : 5
        );
        profile.setSubSpecialty(dto.subSpecialty());
        profile.setLicenseState(dto.licenseState() != null ? dto.licenseState() : "MA");
        profile.setBoardCertifications(dto.boardCertifications());
        profile.setBio(dto.bio());
        profile.setCredentialingStatus(dto.autoApprove() ? "APPROVED" : "PENDING");
        if (dto.autoApprove()) {
            profile.setVerifiedAt(Instant.now());
            profile.setVerifiedBy(adminId);
        }

        DoctorProfile savedProfile = doctorProfileRepository.save(profile);

        String details = "{\"doctorId\":" + savedUser.getId() + ",\"npi\":\"" + dto.npi() + "\",\"autoApproved\":" + dto.autoApprove() + "}";
        auditEventService.recordEvent(
                adminId,
                adminRole,
                "ADMIN_DOCTOR_ONBOARD",
                "DOCTOR_PROFILE:" + savedUser.getId(),
                "SUCCESS",
                details
        );

        return toCredentialingDto(savedProfile);
    }

    private DoctorCredentialingDto toCredentialingDto(DoctorProfile d) {
        String verifiedByName = null;
        if (d.getVerifiedBy() != null) {
            verifiedByName = userRepository.findById(d.getVerifiedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Admin #" + d.getVerifiedBy());
        }
        return new DoctorCredentialingDto(
                d.getId(),
                d.getUser() != null ? (d.getUser().getFirstName() + " " + d.getUser().getLastName()) : "Dr. Provider",
                d.getUser() != null ? d.getUser().getEmail() : "",
                d.getUser() != null ? d.getUser().getPhoneNumber() : "",
                d.getNpi(),
                d.getSpecialty(),
                d.getSubSpecialty(),
                d.getLicenseNumber(),
                d.getLicenseState(),
                d.getBoardCertifications(),
                d.getCredentialingStatus(),
                d.getLicenseExpiryDate(),
                d.getRejectionReason(),
                d.getVerifiedAt(),
                d.getVerifiedBy(),
                verifiedByName,
                d.getCreatedAt(),
                d.getUser() != null && d.getUser().isActive()
        );
    }
}
