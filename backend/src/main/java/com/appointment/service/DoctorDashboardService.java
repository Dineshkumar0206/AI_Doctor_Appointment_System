package com.appointment.service;

import com.appointment.dto.response.AppointmentResponse;
import com.appointment.dto.response.DoctorDashboardStats;
import com.appointment.entity.Appointment;
import com.appointment.entity.Appointment.AppointmentStatus;
import com.appointment.entity.Doctor;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorDashboardService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public DoctorDashboardStats getDashboardStats(String email) {
        Doctor doctor = getDoctorByEmail(email);
        Long doctorId = doctor.getId();
        LocalDate today = LocalDate.now();

        long todayCount = appointmentRepository.countByDoctorIdAndAppointmentDate(doctorId, today);
        long upcomingCount = appointmentRepository.countUpcomingAppointmentsByDoctor(doctorId, today);
        long completedCount = appointmentRepository.countByDoctorIdAndStatus(doctorId, AppointmentStatus.COMPLETED);
        long cancelledCount = appointmentRepository.countByDoctorIdAndStatus(doctorId, AppointmentStatus.CANCELLED);

        return DoctorDashboardStats.builder()
                .todayAppointments(todayCount)
                .upcomingAppointments(upcomingCount)
                .completedAppointments(completedCount)
                .cancelledAppointments(cancelledCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getTodaySchedule(String email) {
        Doctor doctor = getDoctorByEmail(email);
        LocalDate today = LocalDate.now();
        List<Appointment> appointments = appointmentRepository.findTodayAppointmentsByDoctor(doctor.getId(), today);

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Doctor getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + email));
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
