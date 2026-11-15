package com.careconnect360.repository;

import com.careconnect360.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    Optional<Appointment> findByEncounterNumber(String encounterNumber);
    List<Appointment> findByPatientIdOrderByScheduledTimeDesc(Long patientId);
    List<Appointment> findByDoctorIdOrderByScheduledTimeAsc(Long doctorId);
    List<Appointment> findByStatus(String status);
    List<Appointment> findByDoctorIdAndScheduledTimeBetween(Long doctorId, Instant start, Instant end);
    boolean existsByDoctorIdAndScheduledTimeAndStatusIn(Long doctorId, Instant scheduledTime, List<String> activeStatuses);
    boolean existsByDoctorIdAndScheduledTimeAndStatusInAndIdNot(Long doctorId, Instant scheduledTime, List<String> activeStatuses, Long excludeId);
    boolean existsByPatientIdAndScheduledTimeAndStatusIn(Long patientId, Instant scheduledTime, List<String> activeStatuses);
    boolean existsByPatientIdAndScheduledTimeAndStatusInAndIdNot(Long patientId, Instant scheduledTime, List<String> activeStatuses, Long excludeId);
    boolean existsByPatientIdAndDoctorId(Long patientId, Long doctorId);
}
