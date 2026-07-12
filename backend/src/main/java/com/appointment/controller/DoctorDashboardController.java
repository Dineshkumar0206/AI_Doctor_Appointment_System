package com.appointment.controller;

import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.AppointmentResponse;
import com.appointment.dto.response.DoctorDashboardStats;
import com.appointment.service.DoctorDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/doctor/dashboard")
@RequiredArgsConstructor
@Tag(name = "Doctor Dashboard", description = "Dashboard metrics and schedule for doctors")
public class DoctorDashboardController {

    private final DoctorDashboardService doctorDashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Get doctor dashboard stats")
    public ResponseEntity<ApiResponse<DoctorDashboardStats>> getStats(Authentication authentication) {
        DoctorDashboardStats stats = doctorDashboardService.getDashboardStats(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(stats, "Stats retrieved successfully"));
    }

    @GetMapping("/schedule")
    @Operation(summary = "Get today's schedule for doctor")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getTodaySchedule(Authentication authentication) {
        List<AppointmentResponse> schedule = doctorDashboardService.getTodaySchedule(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(schedule, "Today's schedule retrieved successfully"));
    }
}
