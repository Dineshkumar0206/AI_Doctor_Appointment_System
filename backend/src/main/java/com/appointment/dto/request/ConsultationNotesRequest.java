package com.appointment.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationNotesRequest {

    @Size(max = 2000, message = "Diagnosis details cannot exceed 2000 characters")
    private String diagnosis;

    @Size(max = 5000, message = "Prescription details cannot exceed 5000 characters")
    private String prescription;

    @Size(max = 2000, message = "Advice details cannot exceed 2000 characters")
    private String advice;

    private LocalDate followUpDate;
}
