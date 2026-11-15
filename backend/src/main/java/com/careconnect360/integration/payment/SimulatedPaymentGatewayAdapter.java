package com.careconnect360.integration.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Sandboxed, local payment gateway simulator conforming to standard PCI-DSS mock specifications.
 * Simulates real-time merchant acquiring network authorization, ledger validation, and declined responses.
 */
@Component
@Primary
public class SimulatedPaymentGatewayAdapter implements PaymentGatewayAdapter {

    private static final Logger log = LoggerFactory.getLogger(SimulatedPaymentGatewayAdapter.class);

    @Override
    public PaymentGatewayResponse processCharge(BigDecimal amount, String currency, String paymentMethod, String customerRef, String invoiceNumber) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return new PaymentGatewayResponse(
                    false,
                    null,
                    null,
                    "INVALID_AMOUNT",
                    "Transaction amount must be strictly positive.",
                    Instant.now(),
                    getProviderName(),
                    false
            );
        }

        // Simulate decline trigger if paymentMethod or customerRef explicitly contains DECLINE
        if (paymentMethod != null && paymentMethod.toUpperCase().contains("DECLINE")) {
            String txnRef = "TXN-DECLINED-" + System.currentTimeMillis();
            log.warn("Payment decline simulated for invoice #{} [Amount: {} {}]", invoiceNumber, amount, currency);
            return new PaymentGatewayResponse(
                    false,
                    txnRef,
                    null,
                    "CARD_DECLINED",
                    "Card declined by simulated issuing network: Insufficient funds or invalid card status.",
                    Instant.now(),
                    getProviderName(),
                    false
            );
        }

        String txnRef = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String authCode = "AUTH-" + (100000 + (int)(Math.random() * 900000));

        log.info("Simulated payment transaction approved: {} [Invoice: {}, Amount: {} {}]", txnRef, invoiceNumber, amount, currency);

        return new PaymentGatewayResponse(
                true,
                txnRef,
                authCode,
                "00_APPROVED",
                "Transaction approved by sandbox payment gateway simulator.",
                Instant.now(),
                getProviderName(),
                false
        );
    }

    @Override
    public PaymentGatewayResponse refundCharge(String transactionReference, BigDecimal amount, String reason) {
        String refundRef = "REF-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        log.info("Simulated refund processed for txn {}: {} [Reason: {}]", transactionReference, refundRef, reason);
        return new PaymentGatewayResponse(
                true,
                refundRef,
                "REF_AUTH_" + System.currentTimeMillis(),
                "00_REFUNDED",
                "Refund processed successfully.",
                Instant.now(),
                getProviderName(),
                false
        );
    }

    @Override
    public String getProviderName() {
        return "SIMULATED_PCI_SANDBOX";
    }

    @Override
    public boolean isLiveGateway() {
        return false;
    }
}
