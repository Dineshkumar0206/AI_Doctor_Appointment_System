package com.appointment.service;

import com.appointment.dto.request.DoctorRequest;
import com.appointment.dto.response.DoctorResponse;
import com.appointment.entity.Doctor;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorService Unit Tests")
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DoctorService doctorService;

    private User testUser;
    private Doctor testDoctor;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Smith")
                .email("dr.smith@test.com")
                .enabled(true)
                .build();

        testDoctor = Doctor.builder()
                .id(1L)
                .user(testUser)
                .specialization("Cardiology")
                .experience(10)
                .qualification("MD, FACC")
                .consultationFee(BigDecimal.valueOf(500))
                .status(Doctor.DoctorStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should create doctor successfully")
    void createDoctor_ShouldSucceed() {
        // Arrange
        DoctorRequest request = DoctorRequest.builder()
                .userId(1L)
                .specialization("Cardiology")
                .experience(10)
                .consultationFee(BigDecimal.valueOf(500))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(doctorRepository.existsByUserId(1L)).thenReturn(false);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(testDoctor);

        // Act
        DoctorResponse response = doctorService.createDoctor(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getSpecialization()).isEqualTo("Cardiology");
        assertThat(response.getExperience()).isEqualTo(10);
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when doctor already exists for user")
    void createDoctor_ShouldFail_WhenDoctorAlreadyExists() {
        // Arrange
        DoctorRequest request = DoctorRequest.builder().userId(1L).specialization("Cardiology").experience(5).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(doctorRepository.existsByUserId(1L)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> doctorService.createDoctor(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");
        verify(doctorRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return doctor when found by ID")
    void getDoctorById_ShouldReturn_WhenFound() {
        // Arrange
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(testDoctor));

        // Act
        DoctorResponse response = doctorService.getDoctorById(1L);

        // Assert
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getSpecialization()).isEqualTo("Cardiology");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when doctor not found")
    void getDoctorById_ShouldThrow_WhenNotFound() {
        // Arrange
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> doctorService.getDoctorById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("Should delete doctor successfully")
    void deleteDoctor_ShouldSucceed() {
        // Arrange
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(testDoctor));
        doNothing().when(doctorRepository).delete(any(Doctor.class));

        // Act
        doctorService.deleteDoctor(1L);

        // Assert
        verify(doctorRepository, times(1)).delete(testDoctor);
    }

    @Test
    @DisplayName("Should return paginated doctors when getAllDoctors called without keyword")
    void getAllDoctors_ShouldReturnPage() {
        // Arrange
        Page<Doctor> page = new PageImpl<>(List.of(testDoctor));
        when(doctorRepository.findAllActiveDoctors(any())).thenReturn(page);

        // Act
        Page<DoctorResponse> result = doctorService.getAllDoctors(null, PageRequest.of(0, 10));

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSpecialization()).isEqualTo("Cardiology");
    }
}
