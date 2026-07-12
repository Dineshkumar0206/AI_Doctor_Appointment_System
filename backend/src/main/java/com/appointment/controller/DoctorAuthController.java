package com.appointment.controller;

import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.AuthResponse;
import com.appointment.service.DoctorAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/doctor")
@RequiredArgsConstructor
@Tag(name = "Doctor Authentication", description = "Authentication APIs for doctors")
public class DoctorAuthController {

    private final DoctorAuthService doctorAuthService;

    @PostMapping("/login")
    @Operation(summary = "Login as doctor using name and auto-generated password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = doctorAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor login successful"));
    }
}
