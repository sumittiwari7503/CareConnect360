package com.careconnect360.controller;

import com.careconnect360.dto.AppointmentDto;
import com.careconnect360.dto.BookingRequestDto;
import com.careconnect360.dto.CompleteConsultationRequestDto;
import com.careconnect360.dto.ConsultationRecordDto;
import com.careconnect360.dto.RescheduleRequestDto;
import com.careconnect360.dto.RoomSessionDto;
import com.careconnect360.security.UserPrincipal;
import com.careconnect360.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<AppointmentDto>> getMyAppointments(@AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();

        if ("ROLE_ADMIN".equals(role)) {
            return ResponseEntity.ok(appointmentService.getAllAppointments());
        } else if ("ROLE_DOCTOR".equals(role)) {
            return ResponseEntity.ok(appointmentService.getAppointmentsForDoctor(principal.getId()));
        } else {
            return ResponseEntity.ok(appointmentService.getAppointmentsForPatient(principal.getId()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDto> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(appointmentService.getAppointmentDetails(id, principal.getId(), role));
    }

    @PostMapping
    public ResponseEntity<AppointmentDto> bookAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BookingRequestDto request) {
        AppointmentDto booked = appointmentService.bookAppointment(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booked);
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDto> rescheduleAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RescheduleRequestDto request) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        AppointmentDto rescheduled = appointmentService.rescheduleAppointment(id, principal.getId(), role, request);
        return ResponseEntity.ok(rescheduled);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDto> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, String> body) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        String reason = body != null ? body.get("reason") : null;
        AppointmentDto cancelled = appointmentService.cancelAppointment(id, principal.getId(), role, reason);
        return ResponseEntity.ok(cancelled);
    }

    @PostMapping("/{id}/start-consultation")
    public ResponseEntity<AppointmentDto> startConsultation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        AppointmentDto updated = appointmentService.startConsultation(id, principal.getId(), role);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/complete-consultation")
    public ResponseEntity<AppointmentDto> completeConsultation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteConsultationRequestDto request) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        AppointmentDto updated = appointmentService.completeConsultation(id, principal.getId(), role, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/consultation-record")
    public ResponseEntity<ConsultationRecordDto> getConsultationRecord(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(appointmentService.getConsultationRecord(id, principal.getId(), role));
    }

    @GetMapping("/{id}/room-token")
    public ResponseEntity<RoomSessionDto> getRoomToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(appointmentService.getRoomSessionToken(id, principal.getId(), role));
    }
}
