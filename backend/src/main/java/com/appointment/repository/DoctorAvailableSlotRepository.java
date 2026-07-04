package com.appointment.repository;

import com.appointment.entity.DoctorAvailableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorAvailableSlotRepository extends JpaRepository<DoctorAvailableSlot, Long> {

    List<DoctorAvailableSlot> findByDoctorId(Long doctorId);

    List<DoctorAvailableSlot> findByDoctorIdAndDayOfWeek(Long doctorId, DoctorAvailableSlot.DayOfWeek dayOfWeek);

    @Modifying
    @Query("DELETE FROM DoctorAvailableSlot s WHERE s.doctor.id = :doctorId")
    void deleteByDoctorId(@Param("doctorId") Long doctorId);
}
