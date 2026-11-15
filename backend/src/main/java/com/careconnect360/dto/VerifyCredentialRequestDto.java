package com.careconnect360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyCredentialRequestDto(
        @NotBlank(message = "Action is required")
        @Pattern(regexp = "APPROVE|REJECT|SUSPEND|REACTIVATE", message = "Action must be APPROVE, REJECT, SUSPEND, or REACTIVATE")
        String action,
        String notes
) {}
