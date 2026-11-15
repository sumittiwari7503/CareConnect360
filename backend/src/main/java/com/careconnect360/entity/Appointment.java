package com.careconnect360.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id")
    private Long id;

    @Column(name = "encounter_number", nullable = false, unique = true, length = 50)
    private String encounterNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorProfile doctor;

    @Column(name = "scheduled_time", nullable = false)
    private Instant scheduledTime;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 30;

    @Column(name = "modality", nullable = false, length = 20)
    private String modality = "VIDEO"; // 'VIDEO', 'AUDIO', 'IN_PERSON'

    @Column(name = "status", nullable = false, length = 20)
    private String status = "SCHEDULED"; // 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'

    @Column(name = "chief_complaint", length = 500)
    private String chiefComplaint;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ConsultationRecord consultationRecord;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Appointment() {}

    public Appointment(String encounterNumber, PatientProfile patient, DoctorProfile doctor, Instant scheduledTime, String modality, String chiefComplaint) {
        this.encounterNumber = encounterNumber;
        this.patient = patient;
        this.doctor = doctor;
        this.scheduledTime = scheduledTime;
        this.modality = modality;
        this.chiefComplaint = chiefComplaint;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEncounterNumber() { return encounterNumber; }
    public void setEncounterNumber(String encounterNumber) { this.encounterNumber = encounterNumber; }

    public PatientProfile getPatient() { return patient; }
    public void setPatient(PatientProfile patient) { this.patient = patient; }

    public DoctorProfile getDoctor() { return doctor; }
    public void setDoctor(DoctorProfile doctor) { this.doctor = doctor; }

    public Instant getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(Instant scheduledTime) { this.scheduledTime = scheduledTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getModality() { return modality; }
    public void setModality(String modality) { this.modality = modality; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public ConsultationRecord getConsultationRecord() { return consultationRecord; }
    public void setConsultationRecord(ConsultationRecord consultationRecord) { this.consultationRecord = consultationRecord; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
