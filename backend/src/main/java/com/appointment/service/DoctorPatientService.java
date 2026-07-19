package com.appointment.service;

import com.appointment.dto.response.DoctorPatientResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.Doctor;
import com.appointment.entity.Patient;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.PatientRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorPatientService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public Page<DoctorPatientResponse> getPatients(String doctorEmail, String keyword, Pageable pageable) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        return patientRepository.findPatientsByDoctorIdAndKeyword(doctor.getId(), keyword, pageable)
                .map(patient -> mapToResponse(patient, doctor.getId()));
    }

    @Transactional(readOnly = true)
    public DoctorPatientResponse getPatientById(String doctorEmail, Long patientId) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        long appointmentCount = appointmentRepository.countByPatientIdAndDoctorId(patientId, doctor.getId());
        if (appointmentCount == 0) {
            throw new BadRequestException("Unauthorized access to patient details");
        }

        return mapToResponse(patient, doctor.getId());
    }

    private Doctor getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + email));
    }

    private DoctorPatientResponse mapToResponse(Patient patient, Long doctorId) {
        long appointmentCount = appointmentRepository.countByPatientIdAndDoctorId(patient.getId(), doctorId);

        List<Appointment> upcomingList = appointmentRepository.findNextUpcomingAppointmentList(
                patient.getId(), doctorId, LocalDate.now(), PageRequest.of(0, 1)
        );

        String upcomingAptStr = "None";
        if (!upcomingList.isEmpty()) {
            Appointment next = upcomingList.get(0);
            upcomingAptStr = next.getAppointmentDate().toString() + " " + next.getStartTime().toString();
        }

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        return DoctorPatientResponse.builder()
                .patientId(patient.getId())
                .firstName(patient.getUser().getFirstName())
                .lastName(patient.getUser().getLastName())
                .fullName(patient.getUser().getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .age(age)
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .bloodGroup(patient.getBloodGroup())
                .address(patient.getAddress())
                .emergencyContact(patient.getEmergencyContact())
                .medicalNotes(patient.getMedicalNotes())
                .hospitalDetails(patient.getHospitalDetails())
                .appointmentCount(appointmentCount)
                .upcomingAppointment(upcomingAptStr)
                .build();
    }
}
