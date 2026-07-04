package com.appointment.service;

import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.request.RegisterRequest;
import com.appointment.dto.response.AuthResponse;
import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.repository.RefreshTokenRepository;
import com.appointment.repository.RoleRepository;
import com.appointment.repository.UserRepository;
import com.appointment.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private Role patientRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        patientRole = Role.builder().id(1L).name("ROLE_PATIENT").build();
        testUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@test.com")
                .password("encoded_password")
                .enabled(true)
                .roles(Set.of(patientRole))
                .build();
    }

    @Test
    @DisplayName("Should register new user successfully")
    void register_ShouldSucceed_WhenEmailNotExists() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@test.com")
                .password("Password@123")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(roleRepository.findByName("ROLE_PATIENT")).thenReturn(Optional.of(patientRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any())).thenReturn("access_token");
        when(jwtService.getJwtExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access_token");
        assertThat(response.getUser().getEmail()).isEqualTo("john.doe@test.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when email already exists")
    void register_ShouldThrowBadRequest_WhenEmailAlreadyExists() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@test.com")
                .build();
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already registered");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_ShouldSucceed_WithValidCredentials() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.com")
                .password("Password@123")
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                org.springframework.security.core.userdetails.User.builder()
                        .username("john.doe@test.com")
                        .password("encoded")
                        .roles("PATIENT")
                        .build()
        );

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any())).thenReturn("access_token");
        when(jwtService.getJwtExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("john.doe@test.com");
    }
}
