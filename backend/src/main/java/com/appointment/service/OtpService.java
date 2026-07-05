package com.appointment.service;

import com.appointment.entity.OtpToken;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.OtpTokenRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP Service handling the full forgot-password flow:
 * 1. generateAndSendOtp – rate-limited (max 5/hour)
 * 2. verifyOtp          – validates OTP, marks as verified
 * 3. resetPassword      – re-validates OTP, updates password
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_OTP_PER_HOUR = 5;
    private static final int MAX_WRONG_ATTEMPTS = 5;

    private final OtpTokenRepository otpTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    /** In-memory wrong-attempt counter: email -> wrong attempts since last success */
    private final Map<String, Integer> wrongAttempts = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    // ── Step 1: Generate & Send OTP ───────────────────────────────────────────

    @Transactional
    public void generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        // Rate limiting: max 5 OTPs per email per hour
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long requestCount = otpTokenRepository.countByUserAndCreatedAtAfter(user, oneHourAgo);
        if (requestCount >= MAX_OTP_PER_HOUR) {
            log.warn("[OTP] Rate limit exceeded for email={}", email);
            throw new BadRequestException(
                    "Too many OTP requests. Please wait an hour before trying again.");
        }

        // Clean up old unused OTPs for this user
        otpTokenRepository.deleteExpiredTokens(LocalDateTime.now());

        // Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        OtpToken token = OtpToken.builder()
                .user(user)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .used(false)
                .build();

        otpTokenRepository.save(token);
        log.info("[OTP] Generated OTP for email={} expiresAt={}", email, token.getExpiryTime());

        // Send OTP via Email asynchronously
        emailService.sendOtpEmail(user.getId(), otp);
        // Clear wrong attempts on new OTP request
        wrongAttempts.remove(email);
    }

    // ── Step 2: Verify OTP ────────────────────────────────────────────────────

    @Transactional
    public void verifyOtp(String email, String otp) {
        checkWrongAttempts(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        OtpToken token = otpTokenRepository
                .findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(user, otp)
                .orElseThrow(() -> {
                    incrementWrongAttempts(email);
                    return new BadRequestException("Invalid OTP. Please check and try again.");
                });

        if (token.isExpired()) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Mark as verified (but not yet "used" – used is set on reset)
        log.info("[OTP] Successfully verified OTP for email={}", email);
        wrongAttempts.remove(email);
    }

    // ── Step 3: Reset Password ────────────────────────────────────────────────

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        checkWrongAttempts(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        OtpToken token = otpTokenRepository
                .findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(user, otp)
                .orElseThrow(() -> {
                    incrementWrongAttempts(email);
                    return new BadRequestException("Invalid or already-used OTP.");
                });

        if (token.isExpired()) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Mark OTP as used (single-use enforcement)
        token.setUsed(true);
        otpTokenRepository.save(token);

        // Update password with BCrypt hash
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        wrongAttempts.remove(email);
        log.info("[OTP] Password reset successful for email={}", email);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void checkWrongAttempts(String email) {
        int attempts = wrongAttempts.getOrDefault(email, 0);
        if (attempts >= MAX_WRONG_ATTEMPTS) {
            throw new BadRequestException(
                    "Too many failed attempts. Please request a new OTP.");
        }
    }

    private void incrementWrongAttempts(String email) {
        wrongAttempts.merge(email, 1, Integer::sum);
        int attempts = wrongAttempts.get(email);
        log.warn("[OTP] Wrong attempt #{} for email={}", attempts, email);
    }
}
