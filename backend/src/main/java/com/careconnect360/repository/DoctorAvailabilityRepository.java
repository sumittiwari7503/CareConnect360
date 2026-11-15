package com.careconnect360.repository;

import com.careconnect360.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorIdAndActiveTrue(Long doctorId);
    Optional<DoctorAvailability> findByDoctorIdAndDayOfWeekAndActiveTrue(Long doctorId, String dayOfWeek);
}
