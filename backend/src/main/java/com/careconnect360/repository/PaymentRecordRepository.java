package com.careconnect360.repository;

import com.careconnect360.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByInvoiceIdOrderByProcessedAtDesc(Long invoiceId);
    Optional<PaymentRecord> findByTransactionReference(String transactionReference);
}
