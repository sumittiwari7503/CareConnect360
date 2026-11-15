package com.careconnect360.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "insurance_covered_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal insuranceCoveredAmount = BigDecimal.ZERO;

    @Column(name = "patient_copay_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal patientCopayAmount;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private Instant paidAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentRecord> paymentRecords = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Invoice() {}

    public Invoice(String invoiceNumber, Appointment appointment, PatientProfile patient, BigDecimal totalAmount, BigDecimal insuranceCoveredAmount, BigDecimal patientCopayAmount, LocalDate dueDate) {
        this.invoiceNumber = invoiceNumber;
        this.appointment = appointment;
        this.patient = patient;
        this.totalAmount = totalAmount;
        this.insuranceCoveredAmount = insuranceCoveredAmount;
        this.patientCopayAmount = patientCopayAmount;
        this.dueDate = dueDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public PatientProfile getPatient() { return patient; }
    public void setPatient(PatientProfile patient) { this.patient = patient; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getInsuranceCoveredAmount() { return insuranceCoveredAmount; }
    public void setInsuranceCoveredAmount(BigDecimal insuranceCoveredAmount) { this.insuranceCoveredAmount = insuranceCoveredAmount; }

    public BigDecimal getPatientCopayAmount() { return patientCopayAmount; }
    public void setPatientCopayAmount(BigDecimal patientCopayAmount) { this.patientCopayAmount = patientCopayAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }

    public List<PaymentRecord> getPaymentRecords() { return paymentRecords; }
    public void setPaymentRecords(List<PaymentRecord> paymentRecords) { this.paymentRecords = paymentRecords; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
