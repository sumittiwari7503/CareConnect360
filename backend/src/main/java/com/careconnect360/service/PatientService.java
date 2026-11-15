package com.careconnect360.service;

import com.careconnect360.entity.PatientProfile;
import com.careconnect360.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientProfileRepository patientProfileRepository;

    public PatientService(PatientProfileRepository patientProfileRepository) {
        this.patientProfileRepository = patientProfileRepository;
    }

    public List<PatientProfile> getAllPatients() {
        return patientProfileRepository.findAll();
    }

    public Optional<PatientProfile> getPatientById(Long id) {
        return patientProfileRepository.findById(id);
    }

    public Optional<PatientProfile> getPatientByMrn(String mrn) {
        return patientProfileRepository.findByMrn(mrn);
    }
}
