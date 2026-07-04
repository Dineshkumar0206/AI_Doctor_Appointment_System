package com.appointment.controller;

import com.appointment.dto.request.LoginRequest;
import com.appointment.dto.request.RegisterRequest;
import com.appointment.dto.response.AuthResponse;
import com.appointment.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AuthResponse buildAuthResponse() {
        AuthResponse.UserInfo user = AuthResponse.UserInfo.builder()
                .id(1L).firstName("John").lastName("Doe")
                .email("john.doe@test.com")
                .roles(Set.of("ROLE_PATIENT"))
                .build();
        return AuthResponse.builder()
                .accessToken("test_token").refreshToken("refresh_token")
                .tokenType("Bearer").expiresIn(86400000L).user(user)
                .build();
    }

    @Test
    @DisplayName("register() - Should return 201 Created with auth response")
    void register_ShouldReturn201_WithAuthResponse() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John").lastName("Doe")
                .email("john.doe@test.com")
                .password("Password@123").phone("9876543210")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(buildAuthResponse());

        ResponseEntity<?> response = authController.register(request);

        assertThat(response.getStatusCodeValue()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    @DisplayName("login() - Should return 200 OK with auth response")
    void login_ShouldReturn200_WithAuthResponse() {
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.com").password("Password@123")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(buildAuthResponse());

        ResponseEntity<?> response = authController.login(request);

        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    @DisplayName("register() - Should delegate to AuthService once")
    void register_ShouldDelegateToService() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Jane").lastName("Doe")
                .email("jane@test.com").password("Pass@1234")
                .build();

        when(authService.register(any())).thenReturn(buildAuthResponse());

        authController.register(request);

        org.mockito.Mockito.verify(authService, org.mockito.Mockito.times(1)).register(any());
    }
}
