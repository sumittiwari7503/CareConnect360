package com.careconnect360.service;

import com.careconnect360.dto.DoctorDto;
import com.careconnect360.dto.TimeSlotDto;
import com.careconnect360.entity.DoctorAvailability;
import com.careconnect360.entity.DoctorProfile;
import com.careconnect360.entity.User;
import com.careconnect360.exception.ResourceNotFoundException;
import com.careconnect360.repository.AppointmentRepository;
import com.careconnect360.repository.DoctorAvailabilityRepository;
import com.careconnect360.repository.DoctorProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;

    @Value("${app.demo.enabled:true}")
    private boolean demoModeEnabled = true;

    private static final List<String> ACTIVE_STATUSES = List.of("SCHEDULED", "CONFIRMED", "IN_PROGRESS");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    public DoctorService(DoctorProfileRepository doctorProfileRepository,
                         DoctorAvailabilityRepository availabilityRepository,
                         AppointmentRepository appointmentRepository) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.availabilityRepository = availabilityRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public void setDemoModeEnabled(boolean demoModeEnabled) {
        this.demoModeEnabled = demoModeEnabled;
    }

    public boolean isDemoModeEnabled() {
        return demoModeEnabled;
    }

    public List<DoctorDto> searchDoctors(String keyword, String specialty, BigDecimal maxFee, BigDecimal minRating) {
        List<DoctorProfile> allDoctors = doctorProfileRepository.findByAcceptingPatientsTrue();

        return allDoctors.stream()
                .filter(doc -> {
                    if (!demoModeEnabled && doc.isSynthetic()) {
                        return false;
                    }
                    if (!"APPROVED".equalsIgnoreCase(doc.getCredentialingStatus())) {
                        return false;
                    }
                    if (specialty != null && !specialty.isBlank() && !specialty.equalsIgnoreCase("All")) {
                        if (!doc.getSpecialty().equalsIgnoreCase(specialty)) {
                            return false;
                        }
                    }
                    if (maxFee != null && doc.getConsultationFee().compareTo(maxFee) > 0) {
                        return false;
                    }
                    if (minRating != null && doc.getAverageRating().compareTo(minRating) < 0) {
                        return false;
                    }
                    if (keyword != null && !keyword.isBlank()) {
                        String lowerKw = keyword.toLowerCase();
                        String fullName = getDoctorFullName(doc).toLowerCase();
                        boolean matchesName = fullName.contains(lowerKw);
                        boolean matchesSpecialty = doc.getSpecialty() != null && doc.getSpecialty().toLowerCase().contains(lowerKw);
                        boolean matchesSubSpecialty = doc.getSubSpecialty() != null && doc.getSubSpecialty().toLowerCase().contains(lowerKw);
                        boolean matchesBio = doc.getBio() != null && doc.getBio().toLowerCase().contains(lowerKw);
                        return matchesName || matchesSpecialty || matchesSubSpecialty || matchesBio;
                    }
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DoctorDto getDoctorDtoById(Long id) {
        DoctorProfile doc = doctorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));
        return mapToDto(doc);
    }

    public List<TimeSlotDto> getAvailableTimeSlots(Long doctorId, LocalDate date, ZoneId zoneId) {
        if (!doctorProfileRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with ID: " + doctorId);
        }

        String dayOfWeek = date.getDayOfWeek().name();
        Optional<DoctorAvailability> availOpt = availabilityRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctorId, dayOfWeek);

        if (availOpt.isEmpty()) {
            return List.of();
        }

        DoctorAvailability avail = availOpt.get();
        LocalTime start = LocalTime.parse(avail.getStartTime());
        LocalTime end = LocalTime.parse(avail.getEndTime());
        int duration = avail.getSlotDurationMinutes() != null && avail.getSlotDurationMinutes() > 0 ? avail.getSlotDurationMinutes() : 30;

        ZoneId targetZone = zoneId != null ? zoneId : ZoneId.of("UTC");
        Instant now = Instant.now();

        List<TimeSlotDto> slots = new ArrayList<>();
        LocalTime current = start;

        while (!current.plusMinutes(duration).isAfter(end)) {
            ZonedDateTime slotStartZdt = ZonedDateTime.of(date, current, targetZone);
            ZonedDateTime slotEndZdt = slotStartZdt.plusMinutes(duration);
            Instant slotStartInstant = slotStartZdt.toInstant();
            Instant slotEndInstant = slotEndZdt.toInstant();

            boolean isPast = slotStartInstant.isBefore(now);
            boolean isBooked = appointmentRepository.existsByDoctorIdAndScheduledTimeAndStatusIn(doctorId, slotStartInstant, ACTIVE_STATUSES);

            boolean available = !isPast && !isBooked;
            String conflictReason = null;
            if (isPast) {
                conflictReason = "PAST_SLOT";
            } else if (isBooked) {
                conflictReason = "BOOKED";
            }

            String formattedTime = current.format(TIME_FORMATTER);
            slots.add(new TimeSlotDto(slotStartInstant, slotEndInstant, formattedTime, available, conflictReason));

            current = current.plusMinutes(duration);
        }

        return slots;
    }

    public DoctorDto mapToDto(DoctorProfile doc) {
        String fullName = getDoctorFullName(doc);
        String email = doc.getUser() != null ? doc.getUser().getEmail() : "";
        String phone = doc.getUser() != null ? doc.getUser().getPhoneNumber() : "";

        List<DoctorDto.AvailabilitySlotDto> slots = availabilityRepository.findByDoctorIdAndActiveTrue(doc.getId()).stream()
                .map(s -> new DoctorDto.AvailabilitySlotDto(s.getId(), s.getDayOfWeek(), s.getStartTime(), s.getEndTime(), s.getSlotDurationMinutes()))
                .collect(Collectors.toList());

        String nextSlot = "Today at 02:00 PM"; // Default preview indicator

        return new DoctorDto(
                doc.getId(),
                fullName,
                email,
                phone,
                doc.getNpi(),
                doc.getSpecialty(),
                doc.getSubSpecialty(),
                doc.getLicenseNumber(),
                doc.getConsultationFee(),
                doc.getExperienceYears(),
                doc.getBio(),
                doc.getAverageRating(),
                doc.getTotalReviews(),
                doc.isAcceptingPatients(),
                nextSlot,
                slots,
                doc.isSynthetic()
        );
    }

    private String getDoctorFullName(DoctorProfile doc) {
        User u = doc.getUser();
        if (u != null) {
            return "Dr. " + u.getFirstName() + " " + u.getLastName() + ", MD";
        }
        return "Doctor #" + doc.getId();
    }
}
