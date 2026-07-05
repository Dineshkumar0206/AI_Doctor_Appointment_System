package com.appointment.service;

import com.appointment.entity.OtpToken;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.OtpTokenRepository;
import com.appointment.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpService Unit Tests")
class OtpServiceTest {

    @Mock private OtpTokenRepository otpTokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private OtpService otpService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .firstName("Dinesh")
                .lastName("Kumar")
                .email("dinesh@test.com")
                .password("oldHashedPassword")
                .build();
    }

    // ── generateAndSendOtp ─────────────────────────────────────────────────────

    @Test
    @DisplayName("generateAndSendOtp - should save OTP token and call emailService")
    void generateAndSendOtp_success() {
        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(otpTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        otpService.generateAndSendOtp("dinesh@test.com");

        ArgumentCaptor<OtpToken> tokenCaptor = ArgumentCaptor.forClass(OtpToken.class);
        verify(otpTokenRepository).save(tokenCaptor.capture());

        OtpToken saved = tokenCaptor.getValue();
        assertThat(saved.getOtp()).hasSize(6);
        assertThat(saved.getOtp()).containsPattern("\\d{6}");
        assertThat(saved.getUsed()).isFalse();
        assertThat(saved.getExpiryTime()).isAfter(LocalDateTime.now());

        verify(emailService).sendOtpEmail(eq(testUser.getId()), anyString());
    }

    @Test
    @DisplayName("generateAndSendOtp - should throw when email not found")
    void generateAndSendOtp_emailNotFound_throws() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> otpService.generateAndSendOtp("unknown@test.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No account found");
    }

    @Test
    @DisplayName("generateAndSendOtp - should throw when rate limit exceeded (≥5/hour)")
    void generateAndSendOtp_rateLimitExceeded_throws() {
        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(5L);

        assertThatThrownBy(() -> otpService.generateAndSendOtp("dinesh@test.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Too many OTP requests");

        verify(otpTokenRepository, never()).save(any());
        verify(emailService, never()).sendOtpEmail(anyLong(), anyString());
    }

    @Test
    @DisplayName("generateAndSendOtp - OTP must be exactly 6 digits")
    void generateAndSendOtp_otpIs6Digits() {
        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(otpTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Run multiple times to verify randomness still stays 6 digits
        for (int i = 0; i < 10; i++) {
            otpService.generateAndSendOtp("dinesh@test.com");
        }

        ArgumentCaptor<OtpToken> captor = ArgumentCaptor.forClass(OtpToken.class);
        verify(otpTokenRepository, times(10)).save(captor.capture());
        captor.getAllValues().forEach(t -> {
            assertThat(t.getOtp()).hasSize(6);
            assertThat(Integer.parseInt(t.getOtp())).isBetween(0, 999999);
        });
    }

    // ── verifyOtp ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyOtp - should succeed with valid, non-expired OTP")
    void verifyOtp_success() {
        OtpToken token = OtpToken.builder()
                .otp("123456")
                .used(false)
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .user(testUser)
                .build();

        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(testUser, "123456"))
                .thenReturn(Optional.of(token));

        assertThatNoException().isThrownBy(() -> otpService.verifyOtp("dinesh@test.com", "123456"));
    }

    @Test
    @DisplayName("verifyOtp - should throw when OTP not found")
    void verifyOtp_invalidOtp_throws() {
        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(testUser, "999999"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> otpService.verifyOtp("dinesh@test.com", "999999"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid OTP");
    }

    @Test
    @DisplayName("verifyOtp - should throw when OTP is expired")
    void verifyOtp_expiredOtp_throws() {
        OtpToken expiredToken = OtpToken.builder()
                .otp("123456")
                .used(false)
                .expiryTime(LocalDateTime.now().minusMinutes(1)) // expired
                .user(testUser)
                .build();

        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(testUser, "123456"))
                .thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> otpService.verifyOtp("dinesh@test.com", "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    // ── resetPassword ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("resetPassword - should encode new password and mark OTP used")
    void resetPassword_success() {
        OtpToken token = OtpToken.builder()
                .otp("123456")
                .used(false)
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .user(testUser)
                .build();

        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(testUser, "123456"))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPass@123")).thenReturn("newHashedPassword");
        when(otpTokenRepository.save(any())).thenReturn(token);
        when(userRepository.save(any())).thenReturn(testUser);

        otpService.resetPassword("dinesh@test.com", "123456", "NewPass@123");

        assertThat(token.getUsed()).isTrue(); // single-use enforced
        verify(passwordEncoder).encode("NewPass@123");
        verify(userRepository).save(argThat(u -> u.getPassword().equals("newHashedPassword")));
    }

    @Test
    @DisplayName("resetPassword - should throw after 5 wrong attempts")
    void resetPassword_maxWrongAttempts_throws() {
        when(userRepository.findByEmail("dinesh@test.com")).thenReturn(Optional.of(testUser));
        when(otpTokenRepository.findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(testUser, "wrong1"))
                .thenReturn(Optional.empty());

        // 5 wrong attempts
        for (int i = 0; i < 5; i++) {
            try { otpService.verifyOtp("dinesh@test.com", "wrong1"); } catch (Exception ignored) {}
        }

        // 6th attempt should be blocked by rate limit
        assertThatThrownBy(() -> otpService.verifyOtp("dinesh@test.com", "wrong1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Too many failed attempts");
    }
}
