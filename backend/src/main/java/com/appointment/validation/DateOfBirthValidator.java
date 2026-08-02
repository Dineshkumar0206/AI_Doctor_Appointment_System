package com.appointment.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.Period;

public class DateOfBirthValidator implements ConstraintValidator<ValidDateOfBirth, LocalDate> {
    private static final int MAX_AGE = 120; // reasonable upper bound

    @Override
    public void initialize(ValidDateOfBirth constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(LocalDate dob, ConstraintValidatorContext context) {
        if (dob == null) {
            return true; // @NotBlank can enforce required if needed
        }
        LocalDate today = LocalDate.now();
        // Must be in the past
        if (!dob.isBefore(today)) {
            return false;
        }
        // Age must be plausible
        int age = Period.between(dob, today).getYears();
        return age >= 0 && age <= MAX_AGE;
    }
}
