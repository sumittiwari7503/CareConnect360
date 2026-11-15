package com.careconnect360.repository;

import com.careconnect360.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByPatientIdOrderByDueDateDesc(Long patientId);
    List<Invoice> findByStatus(String status);
    Optional<Invoice> findByAppointmentId(Long appointmentId);
}
