package com.appointment.service;

import com.appointment.dto.request.ConsultationNotesRequest;
import com.appointment.dto.response.AppointmentResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.Appointment.AppointmentStatus;
import com.appointment.entity.Doctor;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorAppointmentService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final AiService aiService;

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointments(
            String email, String status, LocalDate startDate, LocalDate endDate, String keyword, Pageable pageable) {
        Doctor doctor = getDoctorByEmail(email);
        AppointmentStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            statusEnum = AppointmentStatus.valueOf(status.toUpperCase());
        }
        return appointmentRepository.searchAppointmentsByDoctor(
                doctor.getId(), statusEnum, startDate, endDate, keyword, pageable
        ).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(String email, Long appointmentId) {
        Doctor doctor = getDoctorByEmail(email);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("Unauthorized access to appointment details");
        }
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateNotes(String email, Long appointmentId, String notes) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        appointment.setNotes(notes);
        appointment = appointmentRepository.save(appointment);
        log.info("Updated notes for appointment: {}", appointmentId);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse saveConsultationNotes(String email, Long appointmentId, ConsultationNotesRequest request) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        appointment.setDiagnosis(request.getDiagnosis());
        appointment.setPrescription(request.getPrescription());
        appointment.setAdvice(request.getAdvice());
        appointment.setFollowUpDate(request.getFollowUpDate());
        appointment = appointmentRepository.save(appointment);
        log.info("Saved consultation notes for appointment: {}", appointmentId);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse completeAppointment(String email, Long appointmentId, ConsultationNotesRequest request) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot complete a cancelled appointment");
        }

        if (request != null) {
            appointment.setDiagnosis(request.getDiagnosis());
            appointment.setPrescription(request.getPrescription());
            appointment.setAdvice(request.getAdvice());
            appointment.setFollowUpDate(request.getFollowUpDate());
        }
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);
        log.info("Completed appointment: {}", appointmentId);

        // Send completion email asynchronously
        emailService.sendAppointmentCompletionEmail(appointmentId);

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(String email, Long appointmentId, String reason) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        if (reason != null && !reason.isBlank()) {
            appointment.setNotes(reason);
        }
        appointment = appointmentRepository.save(appointment);
        log.info("Cancelled appointment: {}", appointmentId);

        // Send cancellation email
        emailService.sendCancellationEmail(appointmentId, reason != null ? reason : "Appointment cancelled by doctor");

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(String email, Long appointmentId, LocalDate newDate, LocalTime newTime) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot reschedule a completed appointment");
        }

        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldTime = appointment.getStartTime();

        appointment.setAppointmentDate(newDate);
        appointment.setStartTime(newTime);
        appointment.setEndTime(newTime.plusMinutes(30)); // standard 30 min duration
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        appointment = appointmentRepository.save(appointment);
        log.info("Rescheduled appointment: {}", appointmentId);

        // Send reschedule email
        emailService.sendRescheduleEmail(appointmentId, oldDate, oldTime);

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse acceptAppointment(String email, Long appointmentId) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Only pending appointments can be accepted");
        }
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);
        log.info("Accepted appointment: {}", appointmentId);

        // Send confirmation email
        emailService.sendAppointmentConfirmation(appointmentId);

        return mapToResponse(appointment);
    }

    // ── AI Integrations ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String generateAiSummary(String email, Long appointmentId) {
        getVerifiedAppointment(email, appointmentId);
        return aiService.generateAppointmentSummary(appointmentId);
    }

    @Transactional(readOnly = true)
    public String generateDiagnosisSuggestions(String email, Long appointmentId) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        String symptoms = appointment.getReason();
        String history = appointment.getPatient().getMedicalNotes();
        return aiService.generateDiagnosisSuggestions(symptoms, history);
    }

    @Transactional(readOnly = true)
    public String generatePrescriptionSuggestions(String email, Long appointmentId) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        String diagnosis = appointment.getDiagnosis();
        String symptoms = appointment.getReason();
        return aiService.generatePrescriptionSuggestions(diagnosis, symptoms);
    }

    @Transactional(readOnly = true)
    public String generatePatientExplanation(String email, Long appointmentId) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        String diagnosis = appointment.getDiagnosis();
        String prescription = appointment.getPrescription();
        return aiService.generatePatientExplanation(diagnosis, prescription);
    }

    @Transactional(readOnly = true)
    public String generateFollowUpAdvice(String email, Long appointmentId) {
        Appointment appointment = getVerifiedAppointment(email, appointmentId);
        String diagnosis = appointment.getDiagnosis();
        String advice = appointment.getAdvice();
        return aiService.generateFollowUpAdvice(diagnosis, advice);
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    private Doctor getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + email));
    }

    private Appointment getVerifiedAppointment(String email, Long appointmentId) {
        Doctor doctor = getDoctorByEmail(email);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("Unauthorized access to appointment");
        }
        return appointment;
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
                .diagnosis(appointment.getDiagnosis())
                .prescription(appointment.getPrescription())
                .advice(appointment.getAdvice())
                .followUpDate(appointment.getFollowUpDate())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}
