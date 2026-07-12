package com.appointment.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileUpdateRequest {

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phone;

    @Size(max = 5000, message = "Bio cannot exceed 5000 characters")
    private String bio;

    @Size(max = 500, message = "Profile photo URL/base64 cannot exceed 500 characters")
    private String profilePhoto;
}
