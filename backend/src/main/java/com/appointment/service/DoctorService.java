package com.appointment.service;

import com.appointment.dto.request.DoctorRequest;
import com.appointment.dto.response.DoctorResponse;
import com.appointment.entity.Doctor;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        if (doctorRepository.existsByUserId(request.getUserId())) {
            throw new BadRequestException("Doctor profile already exists for this user");
        }

        Doctor doctor = Doctor.builder()
                .user(user)
                .specialization(request.getSpecialization())
                .experience(request.getExperience())
                .qualification(request.getQualification())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .status(request.getStatus() != null
                        ? Doctor.DoctorStatus.valueOf(request.getStatus())
                        : Doctor.DoctorStatus.ACTIVE)
                .build();

        doctor = doctorRepository.save(doctor);
        log.info("Created doctor profile for user: {}", user.getEmail());
        return mapToResponse(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return mapToResponse(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user id: " + userId));
        return mapToResponse(doctor);
    }

    @Transactional(readOnly = true)
    public Page<DoctorResponse> getAllDoctors(String keyword, Pageable pageable) {
        if (keyword != null && !keyword.isBlank()) {
            return doctorRepository.searchDoctors(keyword, pageable).map(this::mapToResponse);
        }
        return doctorRepository.findAllActiveDoctors(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getAllDoctorsList() {
        return doctorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getDoctorsBySpecialization(String specialization) {
        return doctorRepository.findBySpecializationContainingIgnoreCaseAndStatusActive(specialization)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        doctor.setSpecialization(request.getSpecialization());
        doctor.setExperience(request.getExperience());
        doctor.setQualification(request.getQualification());
        doctor.setBio(request.getBio());
        if (request.getConsultationFee() != null) {
            doctor.setConsultationFee(request.getConsultationFee());
        }
        if (request.getStatus() != null) {
            doctor.setStatus(Doctor.DoctorStatus.valueOf(request.getStatus()));
        }

        doctor = doctorRepository.save(doctor);
        log.info("Updated doctor: {}", id);
        return mapToResponse(doctor);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        doctorRepository.delete(doctor);
        log.info("Deleted doctor: {}", id);
    }

    @Transactional
    public DoctorResponse updateDoctorStatus(Long id, String status) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        doctor.setStatus(Doctor.DoctorStatus.valueOf(status.toUpperCase()));
        doctor = doctorRepository.save(doctor);
        return mapToResponse(doctor);
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        User user = doctor.getUser();

        List<DoctorResponse.SlotInfo> slots = doctor.getAvailableSlots() == null ? List.of() :
                doctor.getAvailableSlots().stream()
                        .map(slot -> DoctorResponse.SlotInfo.builder()
                                .id(slot.getId())
                                .dayOfWeek(slot.getDayOfWeek().name())
                                .startTime(slot.getStartTime().toString())
                                .endTime(slot.getEndTime().toString())
                                .slotDuration(slot.getSlotDuration())
                                .isAvailable(slot.getIsAvailable())
                                .build())
                        .collect(Collectors.toList());

        return DoctorResponse.builder()
                .id(doctor.getId())
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .specialization(doctor.getSpecialization())
                .experience(doctor.getExperience())
                .qualification(doctor.getQualification())
                .bio(doctor.getBio())
                .profilePhoto(doctor.getProfilePhoto())
                .consultationFee(doctor.getConsultationFee())
                .status(doctor.getStatus().name())
                .availableSlots(slots)
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
