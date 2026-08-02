package com.appointment.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneValidator implements ConstraintValidator<ValidPhone, String> {
    @Override
    public void initialize(ValidPhone constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String phone, ConstraintValidatorContext context) {
        if (phone == null) {
            return true; // @NotBlank can handle null/blank if needed
        }
        // Must be exactly 10 digits
        if (!phone.matches("^[0-9]{10}$")) {
            return false;
        }
        // Reject common placeholder patterns
        if (phone.equals("1234567890")) {
            return false;
        }
        // Reject numbers with all identical digits (e.g., 1111111111)
        if (phone.matches("^(\\d)\\1{9}$")) {
            return false;
        }
        return true;
    }
}
