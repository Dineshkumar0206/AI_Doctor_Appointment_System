package com.appointment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String specialization;
    private Integer experience;
    private String qualification;
    private String bio;
    private BigDecimal consultationFee;
    private String status;
    private List<SlotInfo> availableSlots;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotInfo {
        private Long id;
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private Integer slotDuration;
        private Boolean isAvailable;
    }
}
