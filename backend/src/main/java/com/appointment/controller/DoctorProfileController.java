package com.appointment.controller;

import com.appointment.dto.request.DoctorProfileUpdateRequest;
import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.DoctorResponse;
import com.appointment.service.DoctorProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctor/profile")
@RequiredArgsConstructor
@Tag(name = "Doctor Profile", description = "Profile management APIs for doctors")
public class DoctorProfileController {

    private final DoctorProfileService doctorProfileService;

    @GetMapping
    @Operation(summary = "Get current doctor's profile details")
    public ResponseEntity<ApiResponse<DoctorResponse>> getProfile(Authentication authentication) {
        DoctorResponse response = doctorProfileService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor profile retrieved successfully"));
    }

    @PutMapping
    @Operation(summary = "Update editable doctor profile details (phone, bio, photo)")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody DoctorProfileUpdateRequest request) {
        DoctorResponse response = doctorProfileService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor profile updated successfully"));
    }
}
