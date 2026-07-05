package com.appointment.controller;

import com.appointment.dto.request.ForgotPasswordRequest;
import com.appointment.dto.request.ResetPasswordRequest;
import com.appointment.dto.request.VerifyOtpRequest;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.service.AuthService;
import com.appointment.service.OtpService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController – Forgot Password Endpoint Tests")
class AuthControllerForgotPasswordTest {

    @Mock
    private AuthService authService;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthController authController;

    // ── POST /auth/forgot-password ─────────────────────────────────────────────

    @Test
    @DisplayName("forgotPassword - valid email returns 200 OK")
    void forgotPassword_validEmail_returns200() {
        doNothing().when(otpService).generateAndSendOtp("dinesh@test.com");

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("dinesh@test.com");

        ResponseEntity<?> response = authController.forgotPassword(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(otpService).generateAndSendOtp("dinesh@test.com");
    }

    @Test
    @DisplayName("forgotPassword - unknown email throws ResourceNotFoundException")
    void forgotPassword_unknownEmail_returnsError() {
        doThrow(new ResourceNotFoundException("No account found"))
                .when(otpService).generateAndSendOtp("ghost@test.com");

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("ghost@test.com");

        assertThatThrownBy(() -> authController.forgotPassword(req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── POST /auth/verify-otp ─────────────────────────────────────────────────

    @Test
    @DisplayName("verifyOtp - valid OTP returns 200 OK")
    void verifyOtp_valid_returns200() {
        doNothing().when(otpService).verifyOtp("dinesh@test.com", "483912");

        VerifyOtpRequest req = new VerifyOtpRequest();
        req.setEmail("dinesh@test.com");
        req.setOtp("483912");

        ResponseEntity<?> response = authController.verifyOtp(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(otpService).verifyOtp("dinesh@test.com", "483912");
    }

    @Test
    @DisplayName("verifyOtp - wrong OTP throws BadRequestException")
    void verifyOtp_wrongOtp_returns400() {
        doThrow(new BadRequestException("Invalid OTP"))
                .when(otpService).verifyOtp("dinesh@test.com", "000000");

        VerifyOtpRequest req = new VerifyOtpRequest();
        req.setEmail("dinesh@test.com");
        req.setOtp("000000");

        assertThatThrownBy(() -> authController.verifyOtp(req))
                .isInstanceOf(BadRequestException.class);
    }

    // ── POST /auth/reset-password ─────────────────────────────────────────────

    @Test
    @DisplayName("resetPassword - valid request returns 200 OK")
    void resetPassword_valid_returns200() {
        doNothing().when(otpService).resetPassword("dinesh@test.com", "483912", "NewPass@123");

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("dinesh@test.com");
        req.setOtp("483912");
        req.setNewPassword("NewPass@123");

        ResponseEntity<?> response = authController.resetPassword(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(otpService).resetPassword("dinesh@test.com", "483912", "NewPass@123");
    }
}
