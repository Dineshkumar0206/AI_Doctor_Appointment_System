package com.appointment.config;

import com.appointment.entity.*;
import com.appointment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking database state for seeding...");

        if (roleRepository.count() == 0) {
            log.info("Seeding default roles...");
            roleRepository.save(Role.builder().name("ROLE_ADMIN").build());
            roleRepository.save(Role.builder().name("ROLE_DOCTOR").build());
            roleRepository.save(Role.builder().name("ROLE_PATIENT").build());
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Admin role not found"));
        Role doctorRole = roleRepository.findByName("ROLE_DOCTOR")
                .orElseThrow(() -> new IllegalStateException("Doctor role not found"));
        Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                .orElseThrow(() -> new IllegalStateException("Patient role not found"));

        boolean seeded = false;

        if (!userRepository.existsByEmail("admin@appointment.com")) {
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Admin")
                    .email("admin@appointment.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .phone("1234567890")
                    .roles(new java.util.HashSet<>(Set.of(adminRole)))
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            seeded = true;
        }

        User doctorSmithUser = userRepository.findByEmail("dr.smith@appointment.com").orElseGet(() -> {
            User user = User.builder()
                    .firstName("John")
                    .lastName("Smith")
                    .email("dr.smith@appointment.com")
                    .password(passwordEncoder.encode("Doctor@123"))
                    .phone("1112223333")
                    .roles(new java.util.HashSet<>(Set.of(doctorRole)))
                    .enabled(true)
                    .build();
            return userRepository.save(user);
        });
        doctorSmithUser.setPassword(passwordEncoder.encode("Doctor@123"));
        doctorSmithUser.setEnabled(true);
        doctorSmithUser.setRoles(new java.util.HashSet<>(Set.of(doctorRole)));
        userRepository.save(doctorSmithUser);

        if (!doctorRepository.findByUserId(doctorSmithUser.getId()).isPresent()) {
            Doctor doctorSmith = Doctor.builder()
                    .user(doctorSmithUser)
                    .specialization("Cardiology")
                    .experience(12)
                    .qualification("MD, FACC")
                    .consultationFee(BigDecimal.valueOf(150.0))
                    .status(Doctor.DoctorStatus.ACTIVE)
                    .build();

            DoctorAvailableSlot slotMonMorn = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.MONDAY)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(13, 0))
                    .isAvailable(true)
                    .build();

            DoctorAvailableSlot slotMonAfter = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.MONDAY)
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .isAvailable(true)
                    .build();

            DoctorAvailableSlot slotMonNight = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.MONDAY)
                    .startTime(LocalTime.of(20, 0))
                    .endTime(LocalTime.of(21, 0))
                    .isAvailable(true)
                    .build();

            DoctorAvailableSlot slotWedMorn = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.WEDNESDAY)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(13, 0))
                    .isAvailable(true)
                    .build();

            DoctorAvailableSlot slotWedAfter = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.WEDNESDAY)
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .isAvailable(true)
                    .build();

            DoctorAvailableSlot slotWedNight = DoctorAvailableSlot.builder()
                    .doctor(doctorSmith)
                    .dayOfWeek(DoctorAvailableSlot.DayOfWeek.WEDNESDAY)
                    .startTime(LocalTime.of(20, 0))
                    .endTime(LocalTime.of(21, 0))
                    .isAvailable(true)
                    .build();

            doctorSmith.setAvailableSlots(List.of(slotMonMorn, slotMonAfter, slotMonNight, slotWedMorn, slotWedAfter, slotWedNight));
            doctorRepository.save(doctorSmith);
            seeded = true;
        }

        if (!userRepository.existsByEmail("jane.doe@appointment.com")) {
            User patientJaneUser = User.builder()
                    .firstName("Jane")
                    .lastName("Doe")
                    .email("jane.doe@appointment.com")
                    .password(passwordEncoder.encode("Patient@123"))
                    .phone("9998887777")
                    .roles(new java.util.HashSet<>(Set.of(patientRole)))
                    .enabled(true)
                    .build();
            userRepository.save(patientJaneUser);

            Patient patientJane = Patient.builder()
                    .user(patientJaneUser)
                    .bloodGroup("O+")
                    .emergencyContact("9998881111")
                    .medicalNotes("No known drug allergies.")
                    .build();
            patientRepository.save(patientJane);
            seeded = true;
        }

        if (!appointmentRepository.findAll().isEmpty()) {
            if (appointmentRepository.count() == 0) {
                User patientJaneUser = userRepository.findByEmail("jane.doe@appointment.com")
                        .orElseThrow(() -> new IllegalStateException("Patient user not found"));
                Doctor doctorSmith = doctorRepository.findByUserId(doctorSmithUser.getId())
                        .orElseThrow(() -> new IllegalStateException("Doctor profile not found"));

                Appointment appointment = Appointment.builder()
                        .patient(patientRepository.findByUserId(patientJaneUser.getId()).orElseThrow(() -> new IllegalStateException("Patient profile not found")))
                        .doctor(doctorSmith)
                        .appointmentDate(LocalDate.now().plusDays(2))
                        .startTime(LocalTime.of(10, 0))
                        .endTime(LocalTime.of(10, 30))
                        .status(Appointment.AppointmentStatus.CONFIRMED)
                        .reason("Regular cardiovascular check-up.")
                        .build();
                appointmentRepository.save(appointment);
                seeded = true;
            }
        }

        if (seeded) {
            log.info("Database seeding completed with missing default records.");
        } else {
            log.info("Database already contains the expected default records. Skipping seed.");
        }
    }
}
