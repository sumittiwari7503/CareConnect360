package com.careconnect360.repository;

import com.careconnect360.entity.DoctorProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    Optional<DoctorProfile> findByNpi(String npi);
    List<DoctorProfile> findBySpecialtyIgnoreCase(String specialty);
    List<DoctorProfile> findByAcceptingPatientsTrue();
    List<DoctorProfile> findByCredentialingStatus(String credentialingStatus);
    long countByCredentialingStatus(String credentialingStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DoctorProfile d WHERE d.id = :id")
    Optional<DoctorProfile> findByIdWithLock(@Param("id") Long id);
}
