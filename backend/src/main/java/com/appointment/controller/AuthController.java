package com.appointment.controller;

import com.appointment.dto.request.ForgotPasswordRequest;
import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.request.RefreshTokenRequest;
import com.appointment.dto.request.RegisterRequest;
import com.appointment.dto.request.ResetPasswordRequest;
import com.appointment.dto.request.VerifyOtpRequest;
import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.AuthResponse;
import com.appointment.service.AuthService;
import com.appointment.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Auth APIs - Register, Login, Refresh Token, Logout")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    // ── Forgot Password Flow ──────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Operation(summary = "Request OTP for password reset")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(null,
                "OTP sent to " + request.getEmail() + ". Valid for 5 minutes."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP before password reset")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success(null, "OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using verified OTP")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        otpService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully. Please login."));
    }
}
