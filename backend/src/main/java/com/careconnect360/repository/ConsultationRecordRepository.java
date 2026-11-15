package com.careconnect360.repository;

import com.careconnect360.entity.ConsultationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsultationRecordRepository extends JpaRepository<ConsultationRecord, Long> {
    Optional<ConsultationRecord> findByAppointmentId(Long appointmentId);
}
