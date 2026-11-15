package com.careconnect360.service;

import com.careconnect360.dto.InvoiceDto;
import com.careconnect360.dto.PaymentRecordDto;
import com.careconnect360.dto.ProcessPaymentRequestDto;
import com.careconnect360.entity.Appointment;
import com.careconnect360.entity.Invoice;
import com.careconnect360.entity.PaymentRecord;
import com.careconnect360.repository.AppointmentRepository;
import com.careconnect360.repository.InvoiceRepository;
import com.careconnect360.repository.PaymentRecordRepository;
import com.careconnect360.integration.payment.PaymentGatewayAdapter;
import com.careconnect360.integration.payment.PaymentGatewayResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditEventService auditEventService;
    private final PaymentGatewayAdapter paymentGatewayAdapter;

    public BillingService(
            InvoiceRepository invoiceRepository,
            PaymentRecordRepository paymentRecordRepository,
            AppointmentRepository appointmentRepository,
            AuditEventService auditEventService,
            PaymentGatewayAdapter paymentGatewayAdapter
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.appointmentRepository = appointmentRepository;
        this.auditEventService = auditEventService;
        this.paymentGatewayAdapter = paymentGatewayAdapter;
    }

    public Invoice createInvoiceForAppointment(Appointment appointment, BigDecimal consultationFee) {
        String invNumber = "INV-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000));
        while (invoiceRepository.findByInvoiceNumber(invNumber).isPresent()) {
            invNumber = "INV-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000));
        }

        BigDecimal total = consultationFee != null ? consultationFee : BigDecimal.valueOf(1000.00);
        BigDecimal copay = total.multiply(BigDecimal.valueOf(0.20)); // 20% copay demo standard
        BigDecimal insurance = total.subtract(copay);

        Invoice invoice = new Invoice(
                invNumber,
                appointment,
                appointment.getPatient(),
                total,
                insurance,
                copay,
                LocalDate.now().plusDays(15)
        );
        invoice.setStatus("PENDING");

        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> getInvoicesForPatient(Long patientId, Long callerUserId, String callerRole) {
        if ("ROLE_PATIENT".equals(callerRole) && !callerUserId.equals(patientId)) {
            throw new AccessDeniedException("Patients can only access their own invoices");
        }

        return invoiceRepository.findByPatientIdOrderByDueDateDesc(patientId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceDto getInvoiceById(Long invoiceId, Long callerUserId, String callerRole) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + invoiceId));

        verifyAccess(invoice, callerUserId, callerRole);
        return mapToDto(invoice);
    }

    public InvoiceDto processPayment(Long invoiceId, ProcessPaymentRequestDto request, Long callerUserId, String callerRole) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + invoiceId));

        verifyAccess(invoice, callerUserId, callerRole);

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new IllegalStateException("Invoice #" + invoice.getInvoiceNumber() + " has already been settled");
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        String method = request.paymentMethod() != null ? request.paymentMethod().toUpperCase() : "UPI";
        PaymentGatewayResponse gatewayResponse = paymentGatewayAdapter.processCharge(
                request.amount(),
                "INR",
                method,
                "PATIENT-" + invoice.getPatient().getId(),
                invoice.getInvoiceNumber()
        );

        if (!gatewayResponse.successful()) {
            PaymentRecord failedPayment = new PaymentRecord(
                    invoice,
                    gatewayResponse.transactionReference() != null ? gatewayResponse.transactionReference() : "TXN-DECLINED-" + System.currentTimeMillis(),
                    request.amount(),
                    method,
                    "FAILED"
            );
            paymentRecordRepository.save(failedPayment);
            invoice.setStatus("FAILED");
            invoiceRepository.save(invoice);

            auditEventService.recordEvent(
                    callerUserId,
                    callerRole,
                    "PAYMENT_FAILED",
                    "Invoice:" + invoice.getId(),
                    "FAILURE",
                    String.format("{\"invoiceNumber\":\"%s\",\"reason\":\"%s\",\"gateway\":\"%s\"}", invoice.getInvoiceNumber(), gatewayResponse.message(), gatewayResponse.providerName())
            );

            throw new IllegalArgumentException("Payment failed via " + gatewayResponse.providerName() + ": " + gatewayResponse.message());
        }

        String txnRef = gatewayResponse.transactionReference();
        PaymentRecord payment = new PaymentRecord(
                invoice,
                txnRef,
                request.amount(),
                method,
                "SUCCESS"
        );
        paymentRecordRepository.save(payment);

        invoice.setStatus("PAID");
        invoice.setPaidAt(Instant.now());
        Invoice updated = invoiceRepository.save(invoice);

        auditEventService.recordEvent(
                callerUserId,
                callerRole,
                "PAYMENT_PROCESSED",
                "Invoice:" + updated.getId(),
                "SUCCESS",
                String.format("{\"invoiceNumber\":\"%s\",\"txnRef\":\"%s\",\"amount\":%.2f,\"gateway\":\"%s\",\"liveMode\":%b}",
                        updated.getInvoiceNumber(), txnRef, request.amount().doubleValue(), gatewayResponse.providerName(), gatewayResponse.liveMode())
        );

        return mapToDto(updated);
    }

    public InvoiceDto simulatePaymentFailure(Long invoiceId, Long callerUserId, String callerRole) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + invoiceId));

        verifyAccess(invoice, callerUserId, callerRole);

        String txnRef = "TXN-DECLINED-" + System.currentTimeMillis();
        PaymentRecord failedPayment = new PaymentRecord(
                invoice,
                txnRef,
                invoice.getPatientCopayAmount(),
                "CREDIT_CARD",
                "FAILED"
        );
        paymentRecordRepository.save(failedPayment);

        invoice.setStatus("FAILED");
        Invoice updated = invoiceRepository.save(invoice);

        auditEventService.recordEvent(
                callerUserId,
                callerRole,
                "PAYMENT_FAILED",
                "Invoice:" + updated.getId(),
                "FAILURE",
                String.format("{\"invoiceNumber\":\"%s\",\"reason\":\"Declined by Issuer: Insufficient pre-authorization funds\"}", updated.getInvoiceNumber())
        );

        return mapToDto(updated);
    }

    private void verifyAccess(Invoice invoice, Long callerUserId, String callerRole) {
        if ("ROLE_ADMIN".equals(callerRole)) {
            return;
        }
        if ("ROLE_PATIENT".equals(callerRole) && invoice.getPatient().getId().equals(callerUserId)) {
            return;
        }
        if ("ROLE_DOCTOR".equals(callerRole)) {
            // Doctors can inspect billing related to their encounters
            return;
        }
        throw new AccessDeniedException("Unauthorized access to billing invoice");
    }

    private InvoiceDto mapToDto(Invoice inv) {
        List<PaymentRecordDto> payments = paymentRecordRepository.findByInvoiceIdOrderByProcessedAtDesc(inv.getId())
                .stream()
                .map(p -> new PaymentRecordDto(
                        p.getId(),
                        inv.getId(),
                        inv.getInvoiceNumber(),
                        p.getTransactionReference(),
                        p.getAmountPaid(),
                        p.getPaymentMethod(),
                        p.getPaymentStatus(),
                        p.getProcessedAt()
                ))
                .collect(Collectors.toList());

        String patientName = inv.getPatient().getUser().getFirstName() + " " + inv.getPatient().getUser().getLastName();
        String doctorName = "Dr. " + inv.getAppointment().getDoctor().getUser().getFirstName() + " " + inv.getAppointment().getDoctor().getUser().getLastName();

        return new InvoiceDto(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getAppointment().getId(),
                inv.getAppointment().getEncounterNumber(),
                inv.getPatient().getId(),
                patientName,
                inv.getAppointment().getDoctor().getId(),
                doctorName,
                inv.getAppointment().getDoctor().getSpecialty(),
                inv.getTotalAmount(),
                inv.getInsuranceCoveredAmount(),
                inv.getPatientCopayAmount(),
                inv.getStatus(),
                inv.getDueDate(),
                inv.getPaidAt(),
                payments,
                inv.getCreatedAt()
        );
    }
}
