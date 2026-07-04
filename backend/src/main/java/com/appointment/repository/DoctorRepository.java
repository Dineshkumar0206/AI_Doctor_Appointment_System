package com.appointment.repository;

import com.appointment.entity.Doctor;
import com.appointment.entity.Doctor.DoctorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<Doctor> findByStatus(DoctorStatus status);

    @Query("SELECT d FROM Doctor d WHERE LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%')) AND d.status = 'ACTIVE'")
    List<Doctor> findBySpecializationContainingIgnoreCaseAndStatusActive(@Param("specialization") String specialization);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(LOWER(d.user.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.user.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND d.status = 'ACTIVE'")
    Page<Doctor> searchDoctors(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d FROM Doctor d WHERE d.status = 'ACTIVE'")
    Page<Doctor> findAllActiveDoctors(Pageable pageable);

    long countByStatus(DoctorStatus status);
}
