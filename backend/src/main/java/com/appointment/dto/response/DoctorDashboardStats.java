package com.appointment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDashboardStats {
    private long todayAppointments;
    private long upcomingAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
}
