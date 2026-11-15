package com.careconnect360.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @Column(name = "doctor_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "doctor_id")
    private User user;

    @Column(name = "npi", nullable = false, unique = true, length = 10)
    private String npi;

    @Column(name = "specialty", nullable = false, length = 100)
    private String specialty;

    @Column(name = "sub_specialty", length = 100)
    private String subSpecialty;

    @Column(name = "license_number", nullable = false, length = 50)
    private String licenseNumber;

    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee = BigDecimal.valueOf(1000.00);

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears = 5;

    @Lob
    @Column(name = "bio")
    private String bio;

    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.valueOf(5.00);

    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews = 0;

    @Column(name = "is_accepting_patients", nullable = false)
    private boolean acceptingPatients = true;

    @Column(name = "is_synthetic", nullable = false)
    private boolean synthetic = false;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorAvailability> availabilitySlots = new ArrayList<>();

    @Column(name = "credentialing_status", nullable = false, length = 30)
    private String credentialingStatus = "APPROVED";

    @Column(name = "license_state", length = 10)
    private String licenseState = "MA";

    @Column(name = "board_certifications", length = 255)
    private String boardCertifications;

    @Column(name = "license_expiry_date")
    private java.time.LocalDate licenseExpiryDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public DoctorProfile() {}

    public DoctorProfile(User user, String npi, String specialty, String licenseNumber, BigDecimal consultationFee, Integer experienceYears) {
        this.user = user;
        this.npi = npi;
        this.specialty = specialty;
        this.licenseNumber = licenseNumber;
        this.consultationFee = consultationFee;
        this.experienceYears = experienceYears;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getNpi() { return npi; }
    public void setNpi(String npi) { this.npi = npi; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getSubSpecialty() { return subSpecialty; }
    public void setSubSpecialty(String subSpecialty) { this.subSpecialty = subSpecialty; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }

    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    public boolean isAcceptingPatients() { return acceptingPatients; }
    public void setAcceptingPatients(boolean acceptingPatients) { this.acceptingPatients = acceptingPatients; }

    public List<DoctorAvailability> getAvailabilitySlots() { return availabilitySlots; }
    public void setAvailabilitySlots(List<DoctorAvailability> availabilitySlots) { this.availabilitySlots = availabilitySlots; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getCredentialingStatus() { return credentialingStatus; }
    public void setCredentialingStatus(String credentialingStatus) { this.credentialingStatus = credentialingStatus; }

    public String getLicenseState() { return licenseState; }
    public void setLicenseState(String licenseState) { this.licenseState = licenseState; }

    public String getBoardCertifications() { return boardCertifications; }
    public void setBoardCertifications(String boardCertifications) { this.boardCertifications = boardCertifications; }

    public java.time.LocalDate getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(java.time.LocalDate licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }

    public boolean isSynthetic() { return synthetic; }
    public void setSynthetic(boolean synthetic) { this.synthetic = synthetic; }
}
