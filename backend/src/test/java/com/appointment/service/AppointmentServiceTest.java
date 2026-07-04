package com.appointment.service;

import com.appointment.dto.request.AppointmentRequest;
import com.appointment.dto.response.AppointmentResponse;
import com.appointment.entity.*;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Unit Tests")
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Patient testPatient;
    private Doctor testDoctor;
    private Appointment testAppointment;

    @BeforeEach
    void setUp() {
        User patientUser = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@test.com")
                .build();

        User doctorUser = User.builder()
                .id(2L)
                .firstName("John")
                .lastName("Smith")
                .email("dr.smith@test.com")
                .build();

        testPatient = Patient.builder()
                .id(1L)
                .user(patientUser)
                .build();

        testDoctor = Doctor.builder()
                .id(1L)
                .user(doctorUser)
                .specialization("Cardiology")
                .build();

        testAppointment = Appointment.builder()
                .id(1L)
                .patient(testPatient)
                .doctor(testDoctor)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(Appointment.AppointmentStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("Should book appointment successfully when no conflicts")
    void bookAppointment_ShouldSucceed_WhenNoConflicts() {
        // Arrange
        AppointmentRequest request = AppointmentRequest.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .reason("Regular checkup")
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(testDoctor));
        when(appointmentRepository.findConflictingAppointments(any(), any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(testAppointment);

        // Act
        AppointmentResponse response = appointmentService.bookAppointment(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo("PENDING");
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when there is a conflicting appointment")
    void bookAppointment_ShouldFail_WhenConflictExists() {
        // Arrange
        AppointmentRequest request = AppointmentRequest.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(testDoctor));
        when(appointmentRepository.findConflictingAppointments(any(), any(), any(), any()))
                .thenReturn(List.of(testAppointment));

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should cancel appointment successfully")
    void cancelAppointment_ShouldSucceed() {
        // Arrange
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(testAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        AppointmentResponse response = appointmentService.cancelAppointment(1L);

        // Assert
        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when appointment not found")
    void getAppointmentById_ShouldThrow_WhenNotFound() {
        // Arrange
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.getAppointmentById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Appointment not found");
    }

    @Test
    @DisplayName("Should throw BadRequestException when cancelling completed appointment")
    void cancelAppointment_ShouldFail_WhenAlreadyCompleted() {
        // Arrange
        testAppointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(testAppointment));

        // Act & Assert
        assertThatThrownBy(() -> appointmentService.cancelAppointment(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("completed");
    }
}
