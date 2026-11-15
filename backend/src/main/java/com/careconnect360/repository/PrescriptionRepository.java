package com.careconnect360.repository;

import com.careconnect360.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Optional<Prescription> findByPrescriptionNumber(String prescriptionNumber);
    List<Prescription> findByPatientIdOrderByIssueDateDesc(Long patientId);
    List<Prescription> findByDoctorIdOrderByIssueDateDesc(Long doctorId);
    List<Prescription> findByAppointmentId(Long appointmentId);
}
