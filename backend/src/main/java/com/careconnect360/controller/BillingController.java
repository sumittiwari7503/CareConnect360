package com.careconnect360.controller;

import com.careconnect360.dto.InvoiceDto;
import com.careconnect360.dto.ProcessPaymentRequestDto;
import com.careconnect360.entity.User;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;
    private final UserRepository userRepository;

    public BillingController(BillingService billingService, UserRepository userRepository) {
        this.billingService = billingService;
        this.userRepository = userRepository;
    }

    @GetMapping("/invoices/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<InvoiceDto>> getInvoicesForPatient(
            @PathVariable Long patientId,
            Authentication auth
    ) {
        User user = getUser(auth);
        List<InvoiceDto> list = billingService.getInvoicesForPatient(patientId, user.getId(), user.getRole().name());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InvoiceDto> getInvoiceById(
            @PathVariable Long id,
            Authentication auth
    ) {
        User user = getUser(auth);
        InvoiceDto dto = billingService.getInvoiceById(id, user.getId(), user.getRole().name());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/invoices/{id}/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InvoiceDto> payInvoice(
            @PathVariable Long id,
            @Valid @RequestBody ProcessPaymentRequestDto request,
            Authentication auth
    ) {
        User user = getUser(auth);
        InvoiceDto paid = billingService.processPayment(id, request, user.getId(), user.getRole().name());
        return ResponseEntity.ok(paid);
    }

    @PostMapping("/invoices/{id}/simulate-failure")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InvoiceDto> simulateFailure(
            @PathVariable Long id,
            Authentication auth
    ) {
        User user = getUser(auth);
        InvoiceDto failed = billingService.simulatePaymentFailure(id, user.getId(), user.getRole().name());
        return ResponseEntity.ok(failed);
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + auth.getName()));
    }
}
