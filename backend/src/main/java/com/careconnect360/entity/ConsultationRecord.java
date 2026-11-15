package com.careconnect360.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "consultation_records")
public class ConsultationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "consultation_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Lob
    @Column(name = "doctor_notes")
    private String doctorNotes;

    @Column(name = "diagnosis_code", length = 50)
    private String diagnosisCode;

    @Column(name = "diagnosis_description", length = 255)
    private String diagnosisDescription;

    @Column(name = "systolic_bp")
    private Integer systolicBp;

    @Column(name = "diastolic_bp")
    private Integer diastolicBp;

    @Column(name = "heart_rate_bpm")
    private Integer heartRateBpm;

    @Column(name = "spo2_percent")
    private Integer spo2Percent;

    @Column(name = "vitals_provenance", length = 30)
    private String vitalsProvenance = "NOT_RECORDED";

    @Column(name = "session_started_at")
    private Instant sessionStartedAt;

    @Column(name = "session_ended_at")
    private Instant sessionEndedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ConsultationRecord() {}

    public ConsultationRecord(Appointment appointment, String doctorNotes, String diagnosisCode, String diagnosisDescription) {
        this.appointment = appointment;
        this.doctorNotes = doctorNotes;
        this.diagnosisCode = diagnosisCode;
        this.diagnosisDescription = diagnosisDescription;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public String getDiagnosisCode() { return diagnosisCode; }
    public void setDiagnosisCode(String diagnosisCode) { this.diagnosisCode = diagnosisCode; }

    public String getDiagnosisDescription() { return diagnosisDescription; }
    public void setDiagnosisDescription(String diagnosisDescription) { this.diagnosisDescription = diagnosisDescription; }

    public Integer getSystolicBp() { return systolicBp; }
    public void setSystolicBp(Integer systolicBp) { this.systolicBp = systolicBp; }

    public Integer getDiastolicBp() { return diastolicBp; }
    public void setDiastolicBp(Integer diastolicBp) { this.diastolicBp = diastolicBp; }

    public Integer getHeartRateBpm() { return heartRateBpm; }
    public void setHeartRateBpm(Integer heartRateBpm) { this.heartRateBpm = heartRateBpm; }

    public Integer getSpo2Percent() { return spo2Percent; }
    public void setSpo2Percent(Integer spo2Percent) { this.spo2Percent = spo2Percent; }

    public String getVitalsProvenance() { return vitalsProvenance; }
    public void setVitalsProvenance(String vitalsProvenance) { this.vitalsProvenance = vitalsProvenance; }

    public Instant getSessionStartedAt() { return sessionStartedAt; }
    public void setSessionStartedAt(Instant sessionStartedAt) { this.sessionStartedAt = sessionStartedAt; }

    public Instant getSessionEndedAt() { return sessionEndedAt; }
    public void setSessionEndedAt(Instant sessionEndedAt) { this.sessionEndedAt = sessionEndedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
