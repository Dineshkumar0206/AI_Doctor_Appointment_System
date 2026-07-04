package com.appointment.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Specialization is required")
    @Size(max = 100, message = "Specialization must not exceed 100 characters")
    private String specialization;

    @NotNull(message = "Experience is required")
    @Min(value = 0, message = "Experience must be 0 or greater")
    @Max(value = 60, message = "Experience must not exceed 60 years")
    private Integer experience;

    @Size(max = 255, message = "Qualification must not exceed 255 characters")
    private String qualification;

    private String bio;

    @DecimalMin(value = "0.0", message = "Consultation fee must be 0 or greater")
    private BigDecimal consultationFee;

    private String status; // ACTIVE, INACTIVE, ON_LEAVE
}
