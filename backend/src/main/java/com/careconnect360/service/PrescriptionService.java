package com.careconnect360.service;

import com.careconnect360.dto.CreatePrescriptionRequestDto;
import com.careconnect360.dto.PrescriptionDto;
import com.careconnect360.dto.PrescriptionItemDto;
import com.careconnect360.entity.*;
import com.careconnect360.integration.eprescribe.EPrescribingDispatchResponse;
import com.careconnect360.integration.eprescribe.EPrescribingGatewayAdapter;
import com.careconnect360.repository.AppointmentRepository;
import com.careconnect360.repository.DoctorProfileRepository;
import com.careconnect360.repository.PrescriptionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AuditEventService auditEventService;
    private final EPrescribingGatewayAdapter eprescribingGatewayAdapter;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            DoctorProfileRepository doctorProfileRepository,
            AuditEventService auditEventService,
            EPrescribingGatewayAdapter eprescribingGatewayAdapter
    ) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.auditEventService = auditEventService;
        this.eprescribingGatewayAdapter = eprescribingGatewayAdapter;
    }

    public PrescriptionDto createPrescription(Long doctorUserId, String role, CreatePrescriptionRequestDto request) {
        if (!"ROLE_DOCTOR".equals(role) && !"ROLE_ADMIN".equals(role)) {
            throw new AccessDeniedException("Only authorized physicians can issue prescriptions");
        }

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + request.appointmentId()));

        if (!"ROLE_ADMIN".equals(role) && !appointment.getDoctor().getId().equals(doctorUserId)) {
            throw new AccessDeniedException("Physician is not assigned to this clinical encounter");
        }

        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("At least one medication item is required");
        }

        for (CreatePrescriptionRequestDto.ItemRequest item : request.items()) {
            if (item.medicationName() == null || item.medicationName().trim().isEmpty()) {
                throw new IllegalArgumentException("Medication name cannot be empty");
            }
            if (item.dosage() == null || item.dosage().trim().isEmpty()) {
                throw new IllegalArgumentException("Dosage cannot be empty");
            }
            if (item.durationDays() == null || item.durationDays() <= 0) {
                throw new IllegalArgumentException("Duration days must be a positive integer");
            }
        }

        String rxNumber = "RX-" + (20240000 + new Random().nextInt(90000));
        while (prescriptionRepository.findByPrescriptionNumber(rxNumber).isPresent()) {
            rxNumber = "RX-" + (20240000 + new Random().nextInt(90000));
        }

        String pharmacy = (request.pharmacyName() != null && !request.pharmacyName().isBlank())
                ? request.pharmacyName().trim()
                : "Preferred Network Pharmacy";

        Prescription prescription = new Prescription(
                rxNumber,
                appointment,
                appointment.getPatient(),
                appointment.getDoctor(),
                pharmacy
        );
        prescription.setClinicalNotes(request.clinicalNotes());
        prescription.setStatus("ACTIVE");

        for (CreatePrescriptionRequestDto.ItemRequest itemReq : request.items()) {
            PrescriptionItem item = new PrescriptionItem(
                    itemReq.medicationName().trim(),
                    itemReq.dosage().trim(),
                    itemReq.frequency().trim(),
                    itemReq.durationDays(),
                    itemReq.refillsAllowed() != null ? itemReq.refillsAllowed() : 0,
                    itemReq.instructions()
            );
            prescription.addItem(item);
        }

        Prescription saved = prescriptionRepository.save(prescription);

        EPrescribingDispatchResponse dispatchResponse = eprescribingGatewayAdapter.dispatchPrescription(saved);

        auditEventService.recordEvent(
                doctorUserId,
                role,
                "PRESCRIPTION_ISSUED",
                "Prescription:" + saved.getId(),
                "SUCCESS",
                String.format("{\"prescriptionNumber\":\"%s\",\"itemsCount\":%d,\"eRxGateway\":\"%s\",\"transmissionId\":\"%s\",\"liveMode\":%b}",
                        saved.getPrescriptionNumber(), saved.getItems().size(), dispatchResponse.gatewayName(), dispatchResponse.transmissionId(), dispatchResponse.liveMode())
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public PrescriptionDto getPrescriptionById(Long id, Long callerUserId, String callerRole) {
        Prescription rx = prescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found with ID: " + id));

        verifyAccess(rx, callerUserId, callerRole);
        return mapToDto(rx);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionDto> getPrescriptionsForPatient(Long patientId, Long callerUserId, String callerRole) {
        if ("ROLE_PATIENT".equals(callerRole) && !callerUserId.equals(patientId)) {
            throw new AccessDeniedException("Patients can only view their own prescriptions");
        }

        return prescriptionRepository.findByPatientIdOrderByIssueDateDesc(patientId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionDto> getPrescriptionsForDoctor(Long doctorId, Long callerUserId, String callerRole) {
        if ("ROLE_DOCTOR".equals(callerRole) && !callerUserId.equals(doctorId)) {
            throw new AccessDeniedException("Doctors can only view their own issued prescriptions");
        }

        return prescriptionRepository.findByDoctorIdOrderByIssueDateDesc(doctorId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PrescriptionDto updatePrescriptionStatus(Long id, String status, Long callerUserId, String callerRole) {
        if (!"ROLE_DOCTOR".equals(callerRole) && !"ROLE_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException("Only physicians or administrators can update prescription status");
        }

        Prescription rx = prescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found with ID: " + id));

        if (!"ROLE_ADMIN".equals(callerRole) && !rx.getDoctor().getId().equals(callerUserId)) {
            throw new AccessDeniedException("Physician is not the prescriber for this medication");
        }

        rx.setStatus(status.toUpperCase());
        Prescription updated = prescriptionRepository.save(rx);

        auditEventService.recordEvent(
                callerUserId,
                callerRole,
                "PRESCRIPTION_STATUS_UPDATED",
                "Prescription:" + updated.getId(),
                "SUCCESS",
                String.format("{\"newStatus\":\"%s\"}", updated.getStatus())
        );

        return mapToDto(updated);
    }

    private void verifyAccess(Prescription rx, Long callerUserId, String callerRole) {
        if ("ROLE_ADMIN".equals(callerRole)) {
            return;
        }
        if ("ROLE_PATIENT".equals(callerRole) && rx.getPatient().getId().equals(callerUserId)) {
            return;
        }
        if ("ROLE_DOCTOR".equals(callerRole) && rx.getDoctor().getId().equals(callerUserId)) {
            return;
        }
        throw new AccessDeniedException("Unauthorized access to clinical prescription");
    }

    private PrescriptionDto mapToDto(Prescription p) {
        List<PrescriptionItemDto> items = p.getItems().stream()
                .map(i -> new PrescriptionItemDto(
                        i.getId(),
                        i.getMedicationName(),
                        i.getDosage(),
                        i.getFrequency(),
                        i.getDurationDays(),
                        i.getRefillsAllowed(),
                        i.getInstructions()
                ))
                .collect(Collectors.toList());

        String patientName = p.getPatient().getUser().getFirstName() + " " + p.getPatient().getUser().getLastName();
        String doctorName = "Dr. " + p.getDoctor().getUser().getFirstName() + " " + p.getDoctor().getUser().getLastName();

        return new PrescriptionDto(
                p.getId(),
                p.getPrescriptionNumber(),
                p.getAppointment().getId(),
                p.getAppointment().getEncounterNumber(),
                p.getPatient().getId(),
                patientName,
                p.getDoctor().getId(),
                doctorName,
                p.getDoctor().getSpecialty(),
                p.getIssueDate(),
                p.getStatus(),
                p.getPharmacyName(),
                p.getClinicalNotes(),
                items,
                p.getCreatedAt()
        );
    }
}
