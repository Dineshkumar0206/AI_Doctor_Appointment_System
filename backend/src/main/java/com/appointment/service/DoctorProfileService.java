package com.appointment.service;

import com.appointment.dto.request.DoctorProfileUpdateRequest;
import com.appointment.dto.response.DoctorResponse;
import com.appointment.entity.Doctor;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorProfileService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorService doctorService;

    @Transactional(readOnly = true)
    public DoctorResponse getProfile(String email) {
        Doctor doctor = getDoctorByEmail(email);
        return doctorService.getDoctorById(doctor.getId());
    }

    @Transactional
    public DoctorResponse updateProfile(String email, DoctorProfileUpdateRequest request) {
        Doctor doctor = getDoctorByEmail(email);
        User user = doctor.getUser();

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
            userRepository.save(user);
        }

        if (request.getBio() != null) {
            doctor.setBio(request.getBio());
        }

        if (request.getProfilePhoto() != null) {
            doctor.setProfilePhoto(request.getProfilePhoto());
        }

        doctorRepository.save(doctor);
        log.info("Updated profile for doctor user: {}", email);

        return doctorService.getDoctorById(doctor.getId());
    }

    private Doctor getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    log.info("Doctor profile not found for user: {}, creating default profile", email);
                    Doctor doctor = Doctor.builder()
                            .user(user)
                            .specialization("General Medicine")
                            .experience(0)
                            .qualification("MBBS")
                            .bio("General Physician")
                            .consultationFee(java.math.BigDecimal.ZERO)
                            .status(Doctor.DoctorStatus.ACTIVE)
                            .build();
                    return doctorRepository.save(doctor);
                });
    }
}
