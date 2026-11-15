package com.careconnect360.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProcessPaymentRequestDto(
    @NotNull(message = "amount is required")
    BigDecimal amount,
    @NotNull(message = "paymentMethod is required")
    String paymentMethod, // 'UPI', 'RUPAY_CARD', 'NETBANKING', 'CREDIT_CARD', 'HSA_FSA', 'INSURANCE_CLAIM'
    String syntheticCardNumber, // e.g. "4242" (masked or token, raw card numbers never stored!)
    String cardHolderName,
    String upiId, // e.g. "patient@okhdfcbank"
    String bankName // e.g. "State Bank of India", "HDFC Bank"
) {
    public ProcessPaymentRequestDto(BigDecimal amount, String paymentMethod, String syntheticCardNumber, String cardHolderName) {
        this(amount, paymentMethod, syntheticCardNumber, cardHolderName, null, null);
    }
}
