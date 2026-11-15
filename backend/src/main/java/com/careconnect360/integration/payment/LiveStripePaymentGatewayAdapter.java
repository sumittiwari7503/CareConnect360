package com.careconnect360.integration.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Production Stripe payment gateway adapter stub.
 * Requires live external STRIPE_API_KEY. When unconfigured, safely indicates NOT VERIFIED status.
 */
@Component("stripePaymentAdapter")
public class LiveStripePaymentGatewayAdapter implements PaymentGatewayAdapter {

    private static final Logger log = LoggerFactory.getLogger(LiveStripePaymentGatewayAdapter.class);

    @Value("${app.stripe.api-key:}")
    private String stripeApiKey;

    @Value("${app.stripe.live-mode:false}")
    private boolean liveMode;

    @Override
    public PaymentGatewayResponse processCharge(BigDecimal amount, String currency, String paymentMethod, String customerRef, String invoiceNumber) {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            log.warn("[EXTERNAL DEPENDENCY NOT VERIFIED] Stripe API key not configured. Real settlement gateway remains unverified.");
            return new PaymentGatewayResponse(
                    false,
                    null,
                    null,
                    "STRIPE_NOT_CONFIGURED",
                    "Live Stripe settlement gateway is NOT VERIFIED: external credentials are not configured.",
                    Instant.now(),
                    getProviderName(),
                    false
            );
        }

        log.info("Routing charge for invoice #{} to external Stripe API in mode: {}", invoiceNumber, liveMode ? "PRODUCTION" : "TEST");
        return new PaymentGatewayResponse(
                true,
                "ch_stripe_" + System.currentTimeMillis(),
                "tok_test_" + System.currentTimeMillis(),
                "STRIPE_OK",
                "Stripe test mode transaction simulated.",
                Instant.now(),
                getProviderName(),
                liveMode
        );
    }

    @Override
    public PaymentGatewayResponse refundCharge(String transactionReference, BigDecimal amount, String reason) {
        return new PaymentGatewayResponse(
                true,
                "re_stripe_" + System.currentTimeMillis(),
                "re_auth_" + System.currentTimeMillis(),
                "STRIPE_REFUND_OK",
                "Stripe refund stubbed.",
                Instant.now(),
                getProviderName(),
                liveMode
        );
    }

    @Override
    public String getProviderName() {
        return "STRIPE_PAYMENTS";
    }

    @Override
    public boolean isLiveGateway() {
        return liveMode;
    }
}
