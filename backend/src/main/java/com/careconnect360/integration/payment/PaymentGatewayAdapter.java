package com.careconnect360.integration.payment;

import java.math.BigDecimal;

public interface PaymentGatewayAdapter {
    PaymentGatewayResponse processCharge(BigDecimal amount, String currency, String paymentMethod, String customerRef, String invoiceNumber);
    PaymentGatewayResponse refundCharge(String transactionReference, BigDecimal amount, String reason);
    String getProviderName();
    boolean isLiveGateway();
}
