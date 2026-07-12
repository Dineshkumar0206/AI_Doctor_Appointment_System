package com.appointment.repository;

import com.appointment.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT p FROM Patient p WHERE " +
           "LOWER(p.user.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.user.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Patient> searchPatients(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Patient p JOIN p.appointments a WHERE a.doctor.id = :doctorId AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(p.user.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.user.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Patient> findPatientsByDoctorIdAndKeyword(@Param("doctorId") Long doctorId, @Param("keyword") String keyword, Pageable pageable);
}
