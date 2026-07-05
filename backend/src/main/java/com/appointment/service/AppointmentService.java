package com.appointment.service;

import com.appointment.dto.request.AppointmentRequest;
import com.appointment.dto.response.AppointmentResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.Doctor;
import com.appointment.entity.Patient;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final EmailService emailService;

    @Transactional
    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));

        if (request.getEndTime().isBefore(request.getStartTime()) ||
            request.getEndTime().equals(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        // Check for conflicting appointments
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Doctor is not available at the requested time slot");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(Appointment.AppointmentStatus.PENDING)
                .reason(request.getReason())
                .notes(request.getNotes())
                .build();

        appointment = appointmentRepository.save(appointment);
        log.info("Booked appointment {} for patient {} with doctor {}",
                appointment.getId(), patient.getId(), doctor.getId());

        // Send confirmation email asynchronously
        emailService.sendAppointmentConfirmation(appointment.getId());

        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointmentsByPatient(Long patientId, Pageable pageable) {
        return appointmentRepository.findByPatientId(patientId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointmentsByDoctor(Long doctorId, Pageable pageable) {
        return appointmentRepository.findByDoctorId(doctorId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getTodayAppointments() {
        return appointmentRepository.findTodayAppointments(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getUpcomingAppointments(Pageable pageable) {
        return appointmentRepository.findUpcomingAppointments(LocalDate.now(), pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> searchAppointments(
            Long patientId, Long doctorId, String status,
            LocalDate startDate, LocalDate endDate, Pageable pageable) {

        Appointment.AppointmentStatus appointmentStatus = null;
        if (status != null && !status.isBlank()) {
            appointmentStatus = Appointment.AppointmentStatus.valueOf(status.toUpperCase());
        }

        return appointmentRepository.searchAppointments(
                patientId, doctorId, appointmentStatus, startDate, endDate, pageable
        ).map(this::mapToResponse);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
            appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot update a " + appointment.getStatus() + " appointment");
        }

        // Capture old date/time before updating for reschedule email
        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldTime = appointment.getStartTime();
        boolean dateTimeChanged = !oldDate.equals(request.getAppointmentDate()) ||
                !oldTime.equals(request.getStartTime());

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setReason(request.getReason());
        appointment.setNotes(request.getNotes());

        appointment = appointmentRepository.save(appointment);
        log.info("Updated appointment: {}", id);

        // Send reschedule email only if the time actually changed
        if (dateTimeChanged) {
            emailService.sendRescheduleEmail(appointment.getId(), oldDate, oldTime);
        }

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        Appointment.AppointmentStatus newStatus = Appointment.AppointmentStatus.valueOf(status.toUpperCase());
        appointment.setStatus(newStatus);
        appointment = appointmentRepository.save(appointment);
        log.info("Updated appointment {} status to {}", id, status);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);
        log.info("Cancelled appointment: {}", id);

        // Send cancellation email asynchronously
        emailService.sendCancellationEmail(appointment.getId(), "Appointment cancelled by request");

        return mapToResponse(appointment);
    }

    @Transactional
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointmentRepository.delete(appointment);
        log.info("Deleted appointment: {}", id);
    }

    @Transactional
    public AppointmentResponse saveAiSummary(Long id, String summary) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointment.setAiSummary(summary);
        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getUser().getFullName())
                .patientEmail(appointment.getPatient().getUser().getEmail())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getUser().getFullName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus().name())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .aiSummary(appointment.getAiSummary())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}
