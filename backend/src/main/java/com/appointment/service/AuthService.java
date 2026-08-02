package com.appointment.service;

import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.request.RefreshTokenRequest;
import com.appointment.dto.request.RegisterRequest;
import com.appointment.dto.request.UpdateProfileRequest;
import com.appointment.dto.response.AuthResponse;
import com.appointment.dto.response.UserResponse;
import com.appointment.entity.RefreshToken;
import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.RefreshTokenRepository;
import com.appointment.repository.RoleRepository;
import com.appointment.entity.Patient;
import com.appointment.repository.PatientRepository;
import com.appointment.repository.UserRepository;
import com.appointment.security.JwtService;
import com.appointment.entity.Doctor;
import com.appointment.repository.DoctorRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AiService aiService;
    private final OtpService otpService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        String roleName = (request.getRole() != null && !request.getRole().isBlank())
                ? "ROLE_" + request.getRole().toUpperCase()
                : "ROLE_PATIENT";

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .enabled(true)
                .emailVerified(false)
                .roles(new HashSet<>(Set.of(role)))
                .build();

        user = userRepository.save(user);
        log.info("Registered new user: {} with role: {}", user.getEmail(), roleName);

        if ("ROLE_PATIENT".equals(roleName)) {
            Patient patient = Patient.builder()
                    .user(user)
                    .dateOfBirth(request.getDateOfBirth())
                    .medicalNotes("Registered via signup form.")
                    .build();
            patientRepository.save(patient);
            log.info("Eagerly created patient profile with Date of Birth: {}", request.getDateOfBirth());
        }

        if ("ROLE_DOCTOR".equals(roleName)) {
            Doctor doctor = Doctor.builder()
                    .user(user)
                    .specialization("General Medicine")
                    .experience(0)
                    .qualification("MBBS")
                    .bio("General Physician")
                    .consultationFee(BigDecimal.ZERO)
                    .status(Doctor.DoctorStatus.ACTIVE)
                    .build();
            doctorRepository.save(doctor);
            log.info("Eagerly created doctor profile for user: {}", user.getEmail());
        }

        // Send email verification OTP (not welcome email until verified)
        otpService.generateAndSendVerificationOtp(user.getEmail());

        // Return minimal response — account not yet active
        return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .tokenType(null)
                .expiresIn(0)
                .emailVerificationRequired(true)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .roles(user.getRoles().stream().map(role2 -> role2.getName()).collect(java.util.stream.Collectors.toSet()))
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Block login if email not yet verified
        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Email not verified. Please check your inbox for the verification OTP.");
        }

        // Revoke existing refresh tokens
        refreshTokenRepository.revokeAllByUser(user);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createRefreshToken(user);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Refresh token not found"));

        if (refreshToken.getRevoked()) {
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token has expired. Please login again.");
        }

        User user = refreshToken.getUser();
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        UserDetails userDetails = buildUserDetails(user);
        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = createRefreshToken(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String token) {
        try {
            RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                    .orElseThrow(() -> new BadRequestException("Token not found"));
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            
            User user = refreshToken.getUser();
            if (user != null) {
                aiService.clearChatMemory(user.getEmail());
            }
        } catch (Exception e) {
            log.warn("Logout attempt with invalid token");
        }
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

    private UserDetails buildUserDetails(User user) {
        var authorities = user.getRoles().stream()
                .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
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

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        
        user = userRepository.save(user);
        log.info("Updated user profile for: {}", user.getEmail());

        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
