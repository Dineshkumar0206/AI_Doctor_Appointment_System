package com.appointment.service;

import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.response.AuthResponse;
import com.appointment.entity.Doctor;
import com.appointment.entity.RefreshToken;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.RefreshTokenRepository;
import com.appointment.security.CustomUserDetailsService;
import com.appointment.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorAuthService {

    private final DoctorRepository doctorRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String inputEmail = normalizeInput(request.getEmail());
        String inputPassword = request.getPassword();

        List<Doctor> doctors = doctorRepository.findAll();
        Doctor matchedDoctor = null;

        for (Doctor doctor : doctors) {
            String doctorEmailGenerated = normalizeInput(
                    doctor.getUser().getFirstName() + doctor.getUser().getLastName()
            );
            if (doctorEmailGenerated.equals(inputEmail)) {
                matchedDoctor = doctor;
                break;
            }
        }

        if (matchedDoctor == null) {
            throw new ResourceNotFoundException("Doctor not found with name: " + request.getEmail());
        }

        User user = matchedDoctor.getUser();
        String expectedPassword = generateDoctorPassword(user.getFirstName());

        if (!expectedPassword.equals(inputPassword)) {
            log.warn("Failed login attempt for doctor: {} (normalized: {})", user.getEmail(), inputEmail);
            throw new BadRequestException("Invalid credentials");
        }

        // Generate tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createRefreshToken(user);

        log.info("Doctor logged in successfully: {} (normalized: {})", user.getEmail(), inputEmail);

        // Revoke existing refresh tokens
        refreshTokenRepository.revokeAllByUser(user);

        var roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .roles(roles)
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    private String normalizeInput(String input) {
        if (input == null) return "";
        String cleaned = input.trim().toLowerCase();
        if (cleaned.startsWith("dr.")) {
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith("dr")) {
            cleaned = cleaned.substring(2);
        }
        return cleaned.replaceAll("\\s+", "");
    }

    private String generateDoctorPassword(String firstName) {
        if (firstName == null || firstName.isEmpty()) return "@123";
        String prefix = firstName.substring(0, Math.min(3, firstName.length())).toLowerCase();
        return prefix + "@123";
    }

    private String createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }
}
