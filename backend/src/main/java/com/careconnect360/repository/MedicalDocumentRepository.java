package com.careconnect360.repository;

import com.careconnect360.entity.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {
    List<MedicalDocument> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<MedicalDocument> findByPatientIdAndCategoryOrderByCreatedAtDesc(Long patientId, String category);
}
