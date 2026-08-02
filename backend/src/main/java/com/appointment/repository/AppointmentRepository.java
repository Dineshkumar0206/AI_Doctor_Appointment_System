package com.appointment.repository;

import com.appointment.entity.Appointment;
import com.appointment.entity.Appointment.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Patient appointments
    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);

    List<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status);

    // Doctor appointments
    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    // Today's appointments
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :today ORDER BY a.startTime ASC")
    List<Appointment> findTodayAppointments(@Param("today") LocalDate today);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :today ORDER BY a.startTime ASC")
    List<Appointment> findTodayAppointmentsByDoctor(@Param("doctorId") Long doctorId, @Param("today") LocalDate today);

    // Upcoming appointments
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY a.appointmentDate ASC, a.startTime ASC")
    Page<Appointment> findUpcomingAppointments(@Param("today") LocalDate today, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId AND a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointmentsByPatient(@Param("patientId") Long patientId, @Param("today") LocalDate today);

    // Conflict check
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date AND " +
           "((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "(a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "(a.startTime >= :startTime AND a.endTime <= :endTime)) AND " +
           "a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    List<Appointment> findConflictingAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Dashboard counts
    long countByStatus(AppointmentStatus status);

    long countByAppointmentDate(LocalDate date);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED')")
    long countUpcomingAppointments(@Param("today") LocalDate today);

    // Search with filters
    @Query("SELECT a FROM Appointment a WHERE " +
           "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentDate <= :endDate)")
    Page<Appointment> searchAppointments(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    // ── Email / Reminder queries ──────────────────────────────────────────────

    /**
     * Finds appointments that:
     *  - have NOT had a reminder sent yet
     *  - are NOT cancelled/completed
     *  - start between [windowStart, windowEnd] (used by the 5-min reminder scheduler)
     */
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.reminderSent = false " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "AND a.appointmentDate = :today " +
           "AND a.startTime >= :windowStart " +
           "AND a.startTime <= :windowEnd")
    List<Appointment> findAppointmentsForReminder(
            @Param("today") LocalDate today,
            @Param("windowStart") LocalTime windowStart,
            @Param("windowEnd") LocalTime windowEnd
    );

    /** Used to fetch the patient email for email notifications */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p JOIN FETCH p.user " +
           "JOIN FETCH a.doctor d JOIN FETCH d.user " +
           "WHERE a.id = :id")
    java.util.Optional<Appointment> findByIdWithDetails(@Param("id") Long id);

    /**
     * Finds appointments in PENDING or CONFIRMED status where the time slot + grace period has passed.
     */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p JOIN FETCH p.user " +
           "JOIN FETCH a.doctor d JOIN FETCH d.user " +
           "WHERE a.status IN (com.appointment.entity.Appointment.AppointmentStatus.PENDING, com.appointment.entity.Appointment.AppointmentStatus.CONFIRMED) " +
           "AND (a.appointmentDate < :today OR (a.appointmentDate = :today AND a.endTime <= :cutoffTime))")
    List<Appointment> findOverdueAppointments(
            @Param("today") LocalDate today,
            @Param("cutoffTime") LocalTime cutoffTime
    );

    long countByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);

    long countByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED')")
    long countUpcomingAppointmentsByDoctor(@Param("doctorId") Long doctorId, @Param("today") LocalDate today);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY a.appointmentDate ASC, a.startTime ASC")
    Page<Appointment> findUpcomingAppointmentsByDoctor(@Param("doctorId") Long doctorId, @Param("today") LocalDate today, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(a.patient.user.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.patient.user.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Appointment> searchAppointmentsByDoctor(
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId AND a.doctor.id = :doctorId")
    long countByPatientIdAndDoctorId(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);

    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId AND a.doctor.id = :doctorId AND a.appointmentDate >= :today AND a.status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY a.appointmentDate ASC, a.startTime ASC")
    List<Appointment> findNextUpcomingAppointmentList(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId, @Param("today") LocalDate today, Pageable pageable);
}

