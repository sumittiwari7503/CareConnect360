package com.careconnect360.dto;

import java.time.Instant;
import java.util.List;

public record RoomSessionDto(
        Long appointmentId,
        String encounterNumber,
        String roomId,
        String sessionToken,
        String participantRole,
        String participantName,
        String patientName,
        String patientMrn,
        String doctorName,
        String doctorSpecialty,
        Instant scheduledTime,
        String appointmentStatus,
        Instant authorizedUntil,
        List<String> iceServers
) {}
