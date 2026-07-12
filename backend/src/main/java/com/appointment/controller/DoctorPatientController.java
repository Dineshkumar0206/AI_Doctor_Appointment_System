package com.appointment.controller;

import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.DoctorPatientResponse;
import com.appointment.service.DoctorPatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctor/patients")
@RequiredArgsConstructor
@Tag(name = "Doctor Patients", description = "Patient management APIs for doctors")
public class DoctorPatientController {

    private final DoctorPatientService doctorPatientService;

    @GetMapping
    @Operation(summary = "Get list of patients having appointments with the doctor")
    public ResponseEntity<ApiResponse<Page<DoctorPatientResponse>>> getPatients(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<DoctorPatientResponse> response = doctorPatientService.getPatients(
                authentication.getName(), keyword, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Patients retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient details")
    public ResponseEntity<ApiResponse<DoctorPatientResponse>> getPatientById(
            Authentication authentication,
            @PathVariable Long id) {
        DoctorPatientResponse response = doctorPatientService.getPatientById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient details retrieved successfully"));
    }
}
