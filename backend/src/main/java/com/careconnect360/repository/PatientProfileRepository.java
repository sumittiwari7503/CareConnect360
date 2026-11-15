package com.careconnect360.repository;

import com.careconnect360.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    Optional<PatientProfile> findByMrn(String mrn);
    boolean existsByMrn(String mrn);
}
